import mqtt from 'mqtt';
import { prisma } from '../lib/prisma.js';
import type { Server } from 'socket.io';

const BROKER_URL = 'mqtt://broker.hivemq.com:1883';
const VITALS_TOPIC = 'VitalsWatch/+/vitals';
const ALERTS_TOPIC = 'VitalsWatch/+/alerts';

interface VitalsPayload {
  bpm: number;
  spo2: number;
  timestamp?: number;
}

interface AlertPayload {
  type: 'heart_rate' | 'spo2';
  severity: 'very_low' | 'low' | 'high' | 'very_high';
  timestamp?: number;
}

export function startMqttSubscriber(io: Server) {
  const client = mqtt.connect(BROKER_URL, {
    clientId: `vitalwatch-backend-${Date.now()}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log('[MQTT] Conectado ao broker HiveMQ');
    client.subscribe([VITALS_TOPIC, ALERTS_TOPIC], (err) => {
      if (err) console.error('[MQTT] Erro ao subscrever:', err);
      else console.log(`[MQTT] Subscrito em ${VITALS_TOPIC} e ${ALERTS_TOPIC}`);
    });
  });

  client.on('message', (topic, message) => {
    const parts = topic.split('/');
    const id_micro = parts[1];
    const messageType = parts[2];

    let payload: unknown;
    try {
      payload = JSON.parse(message.toString());
    } catch {
      console.error(`[MQTT] Payload inválido no tópico ${topic}: ${message.toString()}`);
      return;
    }

    if (!id_micro) {
      console.error(`[MQTT] Tópico inválido: ${topic}`);
      return;
    }

    if (messageType === 'vitals') {
      void handleVitals(io, id_micro, payload as VitalsPayload);
    } else if (messageType === 'alerts') {
      void handleAlert(io, id_micro, payload as AlertPayload);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Erro de conexão:', err.message);
  });

  client.on('offline', () => {
    console.warn('[MQTT] Cliente offline, aguardando reconexão...');
  });

  return client;
}

async function handleVitals(io: Server, id_micro: string, payload: VitalsPayload) {
  const { bpm, spo2, timestamp } = payload;

  if (bpm === undefined || spo2 === undefined) {
    console.error('[MQTT] Payload de vitais incompleto:', payload);
    return;
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id_micro },
    });

    if (!paciente) {
      console.warn(`[MQTT] Nenhum paciente com id_micro="${id_micro}" encontrado no banco`);
      return;
    }

    // timestamp do dispositivo é Unix segundos; sem timestamp usa agora
    const time = timestamp ? new Date(timestamp * 1000) : new Date();

    await prisma.medida.create({
      data: {
        paciente_id: paciente.paciente_id,
        batimentos: Math.round(bpm),
        oxigenacao: Math.round(spo2),
        time,
      },
    });

    const socketPayload = {
      paciente_id: paciente.paciente_id,
      batimentos: Math.round(bpm),
      oxigenacao: Math.round(spo2),
      time: time.toISOString(),
    };

    if (paciente.enfermeira_id) {
      io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', socketPayload);
    }
    io.to(`paciente_${paciente.paciente_id}`).emit('novaMedida', socketPayload);

    console.log(`[MQTT] Vitais salvas: id_micro=${id_micro} | bpm=${Math.round(bpm)} | spo2=${Math.round(spo2)}`);
  } catch (error) {
    console.error('[MQTT] Erro ao salvar vitais:', error);
  }
}

async function handleAlert(io: Server, id_micro: string, payload: AlertPayload) {
  const { type, severity, timestamp } = payload;

  if (!type || !severity) {
    console.error('[MQTT] Payload de alerta incompleto:', payload);
    return;
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id_micro },
    });

    if (!paciente) {
      console.warn(`[MQTT] Alerta ignorado: id_micro="${id_micro}" não encontrado no banco`);
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
  } catch (error) {
    console.error('[MQTT] Erro ao processar alerta:', error);
  }
}
