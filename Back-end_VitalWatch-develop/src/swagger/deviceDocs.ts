/**
 * @swagger
 * /device/{pacienteId}/config/{configType}:
 *   post:
 *     summary: Envia uma configuração via MQTT para a pulseira
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: configType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [wifi, thresholds, sampling]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuração enviada com sucesso
 */

/**
 * @swagger
 * /device/{pacienteId}/command:
 *   post:
 *     summary: Envia um comando remoto (START, STOP, REBOOT) para a pulseira
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               command:
 *                 type: string
 *                 enum: [START, STOP, REBOOT]
 *     responses:
 *       200:
 *         description: Comando enviado com sucesso
 */
