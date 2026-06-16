import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const parseDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const mediaBatimentoHora = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Arredonda para o início da hora
  const endHour = new Date(parsedDate);
  endHour.setMinutes(0, 0, 0);

  const startHour = new Date(endHour);
  startHour.setHours(endHour.getHours() - 6);

  try {
    const result = await prisma.estatisticasHorarias.findMany({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: startHour,
          lte: endHour,
        },
      },
      select: {
        data_referencia: true,
        media_batimentos: true,
      },
      orderBy: {
        data_referencia: 'asc',
      },
    });

    // Mapeando para garantir 7 horas (se não tiver dado preenche com 0)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const hour = new Date(endHour);
      hour.setHours(endHour.getHours() - i);
      
      const found = result.find((r: typeof result[number]) => r.data_referencia.getTime() === hour.getTime());
      data.push({
        hora: hour.toISOString(),
        media: found ? found.media_batimentos : 0
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar médias' });
  }
};

export const mediaOxigenacaoHora = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Arredonda para o início da hora
  const endHour = new Date(parsedDate);
  endHour.setMinutes(0, 0, 0);

  const startHour = new Date(endHour);
  startHour.setHours(endHour.getHours() - 6);

  try {
    const result = await prisma.estatisticasHorarias.findMany({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: startHour,
          lte: endHour,
        },
      },
      select: {
        data_referencia: true,
        media_oxigenacao: true,
      },
      orderBy: {
        data_referencia: 'asc',
      },
    });

    // Mapeando para garantir 7 horas (se não tiver dado preenche com 0)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const hour = new Date(endHour);
      hour.setHours(endHour.getHours() - i);
      
      const found = result.find((r: typeof result[number]) => r.data_referencia.getTime() === hour.getTime());
      data.push({
        hora: hour.toISOString(),
        media: found ? found.media_oxigenacao : 0
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar médias' });
  }
};
