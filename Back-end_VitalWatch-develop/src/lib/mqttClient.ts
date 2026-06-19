import mqtt from 'mqtt';
import { prisma } from './prisma.js';
import type { Server } from 'socket.io';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com';
const TOPIC_VITALS = process.env.MQTT_TOPIC_VITALS || 'VitalsWatch/+/vitals';
const TOPIC_ALERTS = process.env.MQTT_TOPIC_ALERTS || 'VitalsWatch/+/alerts';

/**
 * Payload enviado pelo ESP32 no tópico /vitals.
 * Campos: bpm, spo2 e timestamp (Unix seconds, opcional).
 */
interface VitalsPayload {
  bpm: number;
  spo2: number;
  timestamp?: number;
}

/**
 * Payload enviado pelo ESP32 (ou pelo backend) no tópico /alerts.
 */
interface AlertPayload {
  type: 'heart_rate' | 'spo2';
  severity: 'very_low' | 'low' | 'high' | 'very_high';
  timestamp?: number;
}

let mqttClient: mqtt.MqttClient | null = null;

/**
 * Retorna a instância atual do cliente MQTT.
 * Usado pelo DeviceController para publicar configurações e comandos.
 */
export function getMqttClient(): mqtt.MqttClient | null {
  return mqttClient;
}

/**
 * Extrai o id_micro do tópico MQTT.
 * Exemplo: "VitalsWatch/patient_001/vitals" → "patient_001"
 */
function extractIdMicro(topic: string): string | null {
  const parts = topic.split('/');
  // Estrutura esperada: VitalsWatch / {id_micro} / {type}
  if (parts.length === 3 && parts[1]) {
    return parts[1];
  }
  return null;
}

/**
 * Inicializa o cliente MQTT e realiza o subscribe nos tópicos de vitais e alertas.
 * - /vitals: salva a medida no banco e emite 'novaMedida' via Socket.IO
 * - /alerts: emite 'novoAlerta' via Socket.IO (sem persistir no banco)
 *
 * @param io - Instância do Socket.IO para emissão de eventos em tempo real.
 */
export function initMqttClient(io: Server): void {
  const client = mqtt.connect(BROKER_URL, {
    clientId: `vitalwatch-backend-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000, // Tenta reconectar a cada 5s em caso de queda
  });

  mqttClient = client;

  client.on('connect', () => {
    console.log(`[MQTT] Conectado ao broker: ${BROKER_URL}`);

    client.subscribe([TOPIC_VITALS, TOPIC_ALERTS], { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Erro ao fazer subscribe:`, err.message);
      } else {
        console.log(`[MQTT] Subscrito em: ${TOPIC_VITALS} | ${TOPIC_ALERTS}`);
      }
    });
  });

  client.on('message', (topic: string, message: Buffer) => {
    console.log(`[MQTT] Mensagem recebida no tópico "${topic}"`);

    const id_micro = extractIdMicro(topic);
    if (!id_micro) {
      console.warn(`[MQTT] Tópico em formato inesperado, ignorando: ${topic}`);
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(message.toString());
    } catch {
      console.warn(`[MQTT] Payload inválido (não é JSON) no tópico "${topic}":`, message.toString());
      return;
    }

    const parts = topic.split('/');
    const messageType = parts[2];

    if (messageType === 'vitals') {
      void handleVitals(io, id_micro, payload as VitalsPayload);
    } else if (messageType === 'alerts') {
      void handleAlert(io, id_micro, payload as AlertPayload);
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

/**
 * Processa o payload de vitais:
 * salva a medida no banco e emite 'novaMedida' para paciente e enfermeira.
 */
async function handleVitals(io: Server, id_micro: string, payload: VitalsPayload) {
  const { bpm, spo2, timestamp } = payload;

  if (bpm === undefined || spo2 === undefined) {
    console.warn(`[MQTT] Campos obrigatórios ausentes no payload de vitais:`, payload);
    return;
  }

  let paciente: { paciente_id: string; enfermeira_id: string | null } | null;
  try {
    paciente = await prisma.paciente.findUnique({
      where: { id_micro },
      select: { paciente_id: true, enfermeira_id: true },
    });
  } catch (err) {
    console.error(`[MQTT] Erro ao buscar paciente com id_micro="${id_micro}":`, err);
    return;
  }

  if (!paciente) {
    console.warn(`[MQTT] Nenhum paciente encontrado com id_micro="${id_micro}". Verifique o cadastro.`);
    return;
  }

  // O ESP32 envia o timestamp como Unix seconds; sem timestamp usa agora
  const time = timestamp ? new Date(timestamp * 1000) : new Date();

  try {
    await prisma.medida.create({
      data: {
        paciente_id: paciente.paciente_id,
        batimentos: Math.round(bpm),
        oxigenacao: Math.round(spo2),
        time,
      },
    });
    console.log(`[MQTT] Medida salva — paciente=${paciente.paciente_id} bpm=${Math.round(bpm)} spo2=${Math.round(spo2)}`);
  } catch (err) {
    console.error(`[MQTT] Erro ao salvar medida no banco:`, err);
    return;
  }

  // Emite evento WebSocket em tempo real
  const wsPayload = {
    paciente_id: paciente.paciente_id,
    batimentos: Math.round(bpm),
    oxigenacao: Math.round(spo2),
    time: time.toISOString(),
  };

  if (paciente.enfermeira_id) {
    io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', wsPayload);
  }
  io.to(`paciente_${paciente.paciente_id}`).emit('novaMedida', wsPayload);
}

/**
 * Processa o payload de alerta:
 * emite 'novoAlerta' via Socket.IO para paciente e enfermeira (sem persistir no banco).
 */
async function handleAlert(io: Server, id_micro: string, payload: AlertPayload) {
  const { type, severity, timestamp } = payload;

  if (!type || !severity) {
    console.warn(`[MQTT] Payload de alerta incompleto:`, payload);
    return;
  }

  let paciente: { paciente_id: string; enfermeira_id: string | null } | null;
  try {
    paciente = await prisma.paciente.findUnique({
      where: { id_micro },
      select: { paciente_id: true, enfermeira_id: true },
    });
  } catch (err) {
    console.error(`[MQTT] Erro ao buscar paciente com id_micro="${id_micro}":`, err);
    return;
  }

  if (!paciente) {
    console.warn(`[MQTT] Alerta ignorado: id_micro="${id_micro}" não encontrado no banco.`);
    return;
  }

  const time = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();

  const alertPayload = {
    paciente_id: paciente.paciente_id,
    type,
    severity,
    time,
  };

  if (paciente.enfermeira_id) {
    io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novoAlerta', alertPayload);
  }
  io.to(`paciente_${paciente.paciente_id}`).emit('novoAlerta', alertPayload);

  console.log(`[MQTT] Alerta emitido: id_micro=${id_micro} | type=${type} | severity=${severity}`);
}
