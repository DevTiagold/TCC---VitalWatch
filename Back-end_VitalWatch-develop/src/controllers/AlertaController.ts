import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * Retorna os alertas brutos recentes de um paciente (últimas 2 horas).
 * Usado para popular o Histórico de Eventos na carga inicial da página.
 *
 * GET /alertas/recentes/:pacienteId?limit=20
 */
export const getAlertasRecentes = async (req: AuthRequest, res: Response): Promise<any> => {
  const pacienteId = req.params.pacienteId as string;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  if (!pacienteId) {
    return res.status(400).json({ error: 'pacienteId é obrigatório' });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    const alertas = await prisma.alertaBruto.findMany({
      where: {
        paciente_id: pacienteId,
        time: { gte: twoHoursAgo },
      },
      orderBy: { time: 'desc' },
      take: limit,
    });

    return res.json(alertas);
  } catch (error) {
    console.error('[AlertaController] Erro ao buscar alertas recentes:', error);
    return res.status(500).json({ error: 'Erro ao buscar alertas recentes' });
  }
};

/**
 * Retorna o histórico agregado de alertas por hora de um paciente.
 * Usa a continuous aggregate alertas_horarios do TimescaleDB.
 *
 * GET /alertas/historico/:pacienteId?limit=24
 */
export const getAlertasHistorico = async (req: AuthRequest, res: Response): Promise<any> => {
  const pacienteId = req.params.pacienteId as string;
  const limit = Math.min(Number(req.query.limit) || 24, 168); // max 7 dias

  if (!pacienteId) {
    return res.status(400).json({ error: 'pacienteId é obrigatório' });
  }

  try {
    const historico = await prisma.alertasHorarios.findMany({
      where: { paciente_id: pacienteId },
      orderBy: { data_referencia: 'desc' },
      take: limit,
    });

    return res.json(historico);
  } catch (error) {
    console.error('[AlertaController] Erro ao buscar histórico de alertas:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico de alertas' });
  }
};
