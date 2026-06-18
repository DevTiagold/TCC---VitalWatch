import mqtt from 'mqtt';
import { prisma } from './prisma.js';
import type { Server } from 'socket.io';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com';
const TOPIC_VITALS = process.env.MQTT_TOPIC_VITALS || 'VitalsWatch/+/vitals';

/**
 * Extrai o id_micro do tópico MQTT.
 * Exemplo: "VitalsWatch/patient_001/vitals" → "patient_001"
 */
function extractIdMicro(topic: string): string | null {
  const parts = topic.split('/');
  // Estrutura esperada: VitalsWatch / {id_micro} / vitals
  if (parts.length === 3 && parts[1]) {
    return parts[1];
  }
  return null;
}

/**
 * Inicializa o cliente MQTT e realiza o subscribe no tópico de vitais.
 * Ao receber uma mensagem, salva a medida no banco e emite o evento
 * WebSocket 'novaMedida' para as salas do paciente e da enfermeira.
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
  });

  client.on('message', async (topic: string, message: Buffer) => {
    console.log(`[MQTT] Mensagem recebida no tópico "${topic}"`);

    // 1. Extrai o id_micro do tópico
    const id_micro = extractIdMicro(topic);
    if (!id_micro) {
      console.warn(`[MQTT] Tópico em formato inesperado, ignorando: ${topic}`);
      return;
    }

    // 2. Parseia o payload JSON
    let payload: { heart_rate_bpm?: number; spo2_percent?: number; timestamp?: number };
    try {
      payload = JSON.parse(message.toString());
    } catch {
      console.warn(`[MQTT] Payload inválido (não é JSON) no tópico "${topic}":`, message.toString());
      return;
    }

    const { heart_rate_bpm, spo2_percent, timestamp } = payload;

    if (heart_rate_bpm === undefined || spo2_percent === undefined) {
      console.warn(`[MQTT] Campos obrigatórios ausentes no payload do tópico "${topic}":`, payload);
      return;
    }

    // 3. Lookup do paciente pelo id_micro
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

    // 4. Persiste a medida no banco
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

    // 5. Emite evento WebSocket em tempo real
    const wsPayload = {
      paciente_id: paciente.paciente_id,
      batimentos: medidaData.batimentos,
      oxigenacao: medidaData.oxigenacao,
      time: medidaData.time ?? new Date(),
    };

    if (paciente.enfermeira_id) {
      io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', wsPayload);
    }
    io.to(`paciente_${paciente.paciente_id}`).emit('novaMedida', wsPayload);
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
