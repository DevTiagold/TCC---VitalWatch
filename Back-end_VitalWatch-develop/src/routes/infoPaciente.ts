import { Router } from 'express';
import { getInfoPacienteCard, compartilharAcesso } from '../controllers/InfoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para buscar as informações do paciente para o card
router.get('/card/:id', authMiddleware, getInfoPacienteCard);

// Rota para compartilhar acesso (gera QR Code e envia por e-mail)
router.post('/compartilharAcesso', authMiddleware, compartilharAcesso);

export default router;
