import { Router } from 'express';
import {
  mediaBatimentoHora,
  mediaOxigenacaoHora,
} from '../controllers/MedidasController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para buscar as Ãºltimas 7 mÃ©dias de batimentos
router.get('/mediaBatimentoHora', authMiddleware, mediaBatimentoHora);

// Rota para buscar as Ãºltimas 7 mÃ©dias de oxigenaÃ§Ã£o
router.get('/mediaOxigenacaoHora', authMiddleware, mediaOxigenacaoHora);

export default router;
