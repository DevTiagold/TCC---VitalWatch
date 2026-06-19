import { Router } from 'express';
import { publishDeviceCommand, publishDeviceConfig } from '../controllers/DeviceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /device/:pacienteId/config/:configType  (wifi | thresholds | sampling)
router.post('/:pacienteId/config/:configType', authMiddleware, publishDeviceConfig);

// POST /device/:pacienteId/command  { command: START | STOP | REBOOT }
router.post('/:pacienteId/command', authMiddleware, publishDeviceCommand);

export default router;
