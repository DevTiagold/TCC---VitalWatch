/**
 * @swagger
 * /infoPaciente/card/{id}:
 *   get:
 *     summary: Busca as informações do paciente para exibir no card
 *     tags: [InfoPaciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informações retornadas com sucesso
 *       404:
 *         description: Paciente não encontrado
 */

/**
 * @swagger
 * /infoPaciente/compartilharAcesso:
 *   post:
 *     summary: Gera um link/QR Code de acesso e compartilha por email
 *     tags: [InfoPaciente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailDestino:
 *                 type: string
 *     responses:
 *       200:
 *         description: Acesso compartilhado
 */
