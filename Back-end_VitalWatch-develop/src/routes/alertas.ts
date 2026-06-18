import { Router } from 'express';
import { getAlertasRecentes, getAlertasHistorico } from '../controllers/AlertaController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Alertas brutos recentes (últimas 2h) — para Histórico de Eventos
router.get('/recentes/:pacienteId', authMiddleware, getAlertasRecentes);

// Histórico agregado por hora — para visão geral
router.get('/historico/:pacienteId', authMiddleware, getAlertasHistorico);

export default router;
