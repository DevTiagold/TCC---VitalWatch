/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza o login de enfermeiras ou pacientes
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @swagger
 * /auth/enfermeiraRegistro:
 *   post:
 *     summary: Registra uma nova enfermeira
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enfermeira registrada com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /auth/pacienteRegistro:
 *   post:
 *     summary: Registra um novo paciente (Apenas enfermeiras)
 *     tags: [Auth, Paciente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               idade:
 *                 type: number
 *               cpf:
 *                 type: string
 *               telefone:
 *                 type: string
 *               id_micro:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paciente registrado com sucesso
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Altera a senha do usuário
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Senha atual incorreta
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /auth/paciente/{id}:
 *   delete:
 *     summary: Exclui um paciente pelo ID
 *     tags: [Auth, Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário (paciente)
 *     responses:
 *       200:
 *         description: Paciente excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado, apenas enfermeiras
 *       404:
 *         description: Paciente não encontrado
 */
