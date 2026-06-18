import mqtt from 'mqtt';
import { prisma } from './prisma.js';
import type { Server } from 'socket.io';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com';
const TOPIC_VITALS = process.env.MQTT_TOPIC_VITALS || 'VitalsWatch/+/vitals';
const TOPIC_ALERTS = process.env.MQTT_TOPIC_ALERTS || 'VitalsWatch/+/alerts';

/**
 * Extrai o id_micro do tópico MQTT.
 * Exemplo: "VitalsWatch/patient_001/vitals" → "patient_001"
 */
function extractIdMicro(topic: string): string | null {
  const parts = topic.split('/');
  // Estrutura esperada: VitalsWatch / {id_micro} / vitals|alerts
  if (parts.length === 3 && parts[1]) {
    return parts[1];
  }
  return null;
}

// ================================================
// Cálculo de nível de alerta
// ================================================

/** Estado de alerta em memória por paciente (acesso rápido para novaMedida) */
const alertLevelMap = new Map<string, number>();

/**
 * Calcula o nível de alerta baseado no tipo e severidade.
 *
 * Crítico (3): hr_very_low, hr_very_high, spo2_very_low
 * Alerta  (2): spo2_low, hr_high, hr_low
 * Normal  (1): hr_normal, spo2_normal
 */
function calculateAlertLevel(type: string, severity: string): number {
  const key = `${type}_${severity}`;

  const criticalKeys = ['heart_rate_very_low', 'heart_rate_very_high', 'spo2_very_low'];
  const attentionKeys = ['spo2_low', 'heart_rate_high', 'heart_rate_low'];

  if (criticalKeys.includes(key)) return 3;
  if (attentionKeys.includes(key)) return 2;
  return 1;
}

/**
 * Gera um título legível em PT-BR para o alerta.
 */
function generateAlertTitle(type: string, severity: string): string {
  const titles: Record<string, string> = {
    heart_rate_very_low: 'Batimento cardíaco muito baixo',
    heart_rate_low: 'Batimento cardíaco baixo',
    heart_rate_normal: 'Batimento cardíaco normalizado',
    heart_rate_high: 'Batimento cardíaco elevado',
    heart_rate_very_high: 'Batimento cardíaco muito alto',
    spo2_very_low: 'Oxigenação crítica',
    spo2_low: 'Oxigenação baixa',
    spo2_normal: 'Oxigenação normalizada',
  };

  return titles[`${type}_${severity}`] || `Alerta: ${type} (${severity})`;
}

// ================================================
// Lookup de paciente (com cache simples)
// ================================================

const pacienteCache = new Map<string, { paciente_id: string; enfermeira_id: string | null }>();

async function lookupPaciente(id_micro: string) {
  const cached = pacienteCache.get(id_micro);
  if (cached) return cached;

  const paciente = await prisma.paciente.findUnique({
    where: { id_micro },
    select: { paciente_id: true, enfermeira_id: true },
  });

  if (paciente) {
    pacienteCache.set(id_micro, paciente);
  }

  return paciente;
}

// ================================================
// Inicialização do Cliente MQTT
// ================================================

/**
 * Inicializa o cliente MQTT e realiza o subscribe nos tópicos de vitais e alertas.
 * Ao receber uma mensagem, salva no banco e emite eventos WebSocket em tempo real.
 *
 * @param io - Instância do Socket.IO para emissão de eventos em tempo real.
 */
export function initMqttClient(io: Server): void {
  const client = mqtt.connect(BROKER_URL, {
    clientId: `vitalwatch-backend-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000, // Tenta reconectar a cada 5s em caso de queda
  });

  client.on('connect', () => {
    console.log(`[MQTT] Conectado ao broker: ${BROKER_URL}`);

    client.subscribe(TOPIC_VITALS, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Erro ao fazer subscribe em "${TOPIC_VITALS}":`, err.message);
      } else {
        console.log(`[MQTT] Subscribe realizado no tópico: ${TOPIC_VITALS}`);
      }
    });

    client.subscribe(TOPIC_ALERTS, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Erro ao fazer subscribe em "${TOPIC_ALERTS}":`, err.message);
      } else {
        console.log(`[MQTT] Subscribe realizado no tópico: ${TOPIC_ALERTS}`);
      }
    });
  });

  client.on('message', async (topic: string, message: Buffer) => {
    console.log(`[MQTT] Mensagem recebida no tópico "${topic}"`);

    const id_micro = extractIdMicro(topic);
    if (!id_micro) {
      console.warn(`[MQTT] Tópico em formato inesperado, ignorando: ${topic}`);
      return;
    }

    // Determina se é vitals ou alerts
    if (topic.endsWith('/alerts')) {
      await handleAlertMessage(io, id_micro, message);
    } else if (topic.endsWith('/vitals')) {
      await handleVitalsMessage(io, id_micro, message);
    }
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Tentando reconectar ao broker...');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Erro no cliente MQTT:', err.message);
  });

  client.on('offline', () => {
    console.warn('[MQTT] Cliente MQTT está offline.');
  });

  client.on('disconnect', () => {
    console.warn('[MQTT] Cliente MQTT desconectado do broker.');
  });
}

// ================================================
// Handler de Alertas
// ================================================

async function handleAlertMessage(io: Server, id_micro: string, message: Buffer): Promise<void> {
  // 1. Parseia o payload JSON
  let payload: { type?: string; severity?: string; timestamp?: number };
  try {
    payload = JSON.parse(message.toString());
  } catch {
    console.warn(`[MQTT] Payload de alerta inválido (não é JSON):`, message.toString());
    return;
  }

  const { type, severity, timestamp } = payload;

  if (!type || !severity) {
    console.warn(`[MQTT] Campos obrigatórios ausentes no alerta:`, payload);
    return;
  }

  // 2. Lookup do paciente
  let paciente: { paciente_id: string; enfermeira_id: string | null } | null;
  try {
    paciente = await lookupPaciente(id_micro);
  } catch (err) {
    console.error(`[MQTT] Erro ao buscar paciente com id_micro="${id_micro}":`, err);
    return;
  }

  if (!paciente) {
    console.warn(`[MQTT] Nenhum paciente encontrado com id_micro="${id_micro}".`);
    return;
  }

  // 3. Calcula nível e título
  const nivel = calculateAlertLevel(type, severity);
  const titulo = generateAlertTitle(type, severity);
  const alertTime = timestamp ? new Date(timestamp * 1000) : new Date();

  // 4. Persiste no banco (alertas_brutos — hypertable TimescaleDB)
  try {
    await prisma.alertaBruto.create({
      data: {
        paciente_id: paciente.paciente_id,
        tipo: type,
        severidade: severity,
        nivel,
        time: alertTime,
      },
    });
    console.log(`[MQTT] Alerta salvo — paciente=${paciente.paciente_id} tipo=${type} severidade=${severity} nivel=${nivel}`);
  } catch (err) {
    console.error(`[MQTT] Erro ao salvar alerta no banco:`, err);
    return;
  }

  // 5. Atualiza Map em memória (para incluir no próximo novaMedida)
  const currentLevel = alertLevelMap.get(paciente.paciente_id) ?? 1;
  if (nivel > currentLevel) {
    alertLevelMap.set(paciente.paciente_id, nivel);
  }

  // 6. Emite evento WebSocket 'novoAlerta'
  const wsAlertPayload = {
    paciente_id: paciente.paciente_id,
    alertLevel: nivel,
    tipo: type,
    severidade: severity,
    titulo,
    criado_em: alertTime.toISOString(),
  };

  if (paciente.enfermeira_id) {
    io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novoAlerta', wsAlertPayload);
  }
  io.to(`paciente_${paciente.paciente_id}`).emit('novoAlerta', wsAlertPayload);
}

// ================================================
// Handler de Vitais (lógica existente + alertLevel)
// ================================================

async function handleVitalsMessage(io: Server, id_micro: string, message: Buffer): Promise<void> {
  // 1. Parseia o payload JSON
  let payload: { heart_rate_bpm?: number; spo2_percent?: number; timestamp?: number };
  try {
    payload = JSON.parse(message.toString());
  } catch {
    console.warn(`[MQTT] Payload inválido (não é JSON):`, message.toString());
    return;
  }

  const { heart_rate_bpm, spo2_percent, timestamp } = payload;

  if (heart_rate_bpm === undefined || spo2_percent === undefined) {
    console.warn(`[MQTT] Campos obrigatórios ausentes no payload de vitais:`, payload);
    return;
  }

  // 2. Lookup do paciente
  let paciente: { paciente_id: string; enfermeira_id: string | null } | null;
  try {
    paciente = await lookupPaciente(id_micro);
  } catch (err) {
    console.error(`[MQTT] Erro ao buscar paciente com id_micro="${id_micro}":`, err);
    return;
  }

  if (!paciente) {
    console.warn(`[MQTT] Nenhum paciente encontrado com id_micro="${id_micro}". Verifique o cadastro.`);
    return;
  }

  // 3. Persiste a medida no banco
  const medidaData: {
    paciente_id: string;
    batimentos: number;
    oxigenacao: number;
    time?: Date;
  } = {
    paciente_id: paciente.paciente_id,
    batimentos: Math.round(heart_rate_bpm),
    oxigenacao: Math.round(spo2_percent),
  };

  if (timestamp) {
    // O ESP envia o timestamp como Unix seconds
    medidaData.time = new Date(timestamp * 1000);
  }

  try {
    await prisma.medida.create({ data: medidaData });
    console.log(`[MQTT] Medida salva — paciente=${paciente.paciente_id} bpm=${medidaData.batimentos} spo2=${medidaData.oxigenacao}`);
  } catch (err) {
    console.error(`[MQTT] Erro ao salvar medida no banco:`, err);
    return;
  }

  // 4. Emite evento WebSocket em tempo real (com alertLevel)
  const alertLevel = alertLevelMap.get(paciente.paciente_id) ?? 1;

  const wsPayload = {
    paciente_id: paciente.paciente_id,
    batimentos: medidaData.batimentos,
    oxigenacao: medidaData.oxigenacao,
    time: medidaData.time ?? new Date(),
    alertLevel,
  };

  if (paciente.enfermeira_id) {
    io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', wsPayload);
  }
  io.to(`paciente_${paciente.paciente_id}`).emit('novaMedida', wsPayload);

  // 5. Reseta o nível de alerta após enviar (para que o próximo ciclo comece limpo)
  // O nível será reavaliado quando chegar o próximo alerta do ESP32
  alertLevelMap.set(paciente.paciente_id, 1);
}
