import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getMqttClient } from '../lib/mqttClient.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const ALLOWED_CONFIG_TYPES = ['wifi', 'thresholds', 'sampling'] as const;
type ConfigType = (typeof ALLOWED_CONFIG_TYPES)[number];

const ALLOWED_COMMANDS = ['START', 'STOP', 'REBOOT'] as const;
type DeviceCommand = (typeof ALLOWED_COMMANDS)[number];

export const publishDeviceConfig = async (req: AuthRequest, res: Response): Promise<any> => {
  const pacienteId = req.params['pacienteId'] as string;
  const configType = req.params['configType'] as string;

  if (!ALLOWED_CONFIG_TYPES.includes(configType as ConfigType)) {
    return res.status(400).json({ error: `Tipo de configuração inválido. Use: ${ALLOWED_CONFIG_TYPES.join(', ')}` });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Payload de configuração não pode ser vazio' });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { paciente_id: pacienteId },
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (!paciente.id_micro) {
      return res.status(422).json({ error: 'Este paciente não tem um dispositivo associado (id_micro não definido)' });
    }

    const client = getMqttClient();
    if (!client || !client.connected) {
      return res.status(503).json({ error: 'Broker MQTT indisponível no momento' });
    }

    const topic = `VitalsWatch/${paciente.id_micro}/config/${configType}`;
    const message = JSON.stringify(payload);

    await new Promise<void>((resolve, reject) => {
      client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`[Device] Config publicada: ${topic} → ${message}`);
    return res.status(200).json({ message: 'Configuração publicada com sucesso', topic });
  } catch (error) {
    console.error('[Device] Erro ao publicar configuração:', error);
    return res.status(500).json({ error: 'Erro ao publicar configuração no dispositivo' });
  }
};

export const publishDeviceCommand = async (req: AuthRequest, res: Response): Promise<any> => {
  const pacienteId = req.params['pacienteId'] as string;
  const command = (req.body?.command as string)?.toUpperCase();

  if (!ALLOWED_COMMANDS.includes(command as DeviceCommand)) {
    return res.status(400).json({ error: `Comando inválido. Use: ${ALLOWED_COMMANDS.join(', ')}` });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { paciente_id: pacienteId },
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (!paciente.id_micro) {
      return res.status(422).json({ error: 'Este paciente não tem um dispositivo associado (id_micro não definido)' });
    }

    const client = getMqttClient();
    if (!client || !client.connected) {
      return res.status(503).json({ error: 'Broker MQTT indisponível no momento' });
    }

    const topic = `VitalsWatch/${paciente.id_micro}/command`;

    await new Promise<void>((resolve, reject) => {
      client.publish(topic, command, { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`[Device] Comando publicado: ${topic} → ${command}`);
    return res.status(200).json({ message: `Comando ${command} enviado com sucesso`, topic });
  } catch (error) {
    console.error('[Device] Erro ao publicar comando:', error);
    return res.status(500).json({ error: 'Erro ao enviar comando ao dispositivo' });
  }
};
