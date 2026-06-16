import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export const getInfoPacienteCard = async (req: AuthRequest, res: Response): Promise<any> => {
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({ error: 'ID do paciente nÃo fornecido na requisicao' });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { paciente_id: id },
      select: {
        nome: true,
        idade: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente nÃo encontrado' });
    }

    return res.json({
      nome: paciente.nome,
      idade: paciente.idade,
      email: paciente.user.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar informações do paciente' });
  }
};

export const compartilharAcesso = async (req: AuthRequest, res: Response): Promise<any> => {
  const pacienteId = req.user?.id;
  const { emailDestino } = req.body;

  if (!pacienteId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!emailDestino) {
    return res.status(400).json({ error: 'Email de destino é obrigatório' });
  }

  try {
    const paciente = await prisma.user.findUnique({ where: { id: pacienteId } });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const { sendMail } = await import('../lib/mailer.js');
    const jwt = await import('jsonwebtoken');
    const qrcode = await import('qrcode');
    const SECRET_KEY = (process.env.JWT_SECRET) as string;

    // Generate a 7-day token
    const token = jwt.default.sign(
      { id: paciente.id, role: paciente.role },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginLink = `${frontendUrl}/login?token=${token}`;

    // Generate QR Code as Data URI
    const qrCodeDataUri = await qrcode.default.toDataURL(loginLink);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Acesso Compartilhado - VitalWatch</h2>
        <p>O paciente <strong>${paciente.nome || paciente.email}</strong> compartilhou o acesso ao seu perfil com você.</p>
        <p>Este acesso é válido por 7 dias.</p>
        <p>Você pode acessar a plataforma pelo link abaixo:</p>
        <a href="${loginLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px;">Acessar Perfil</a>
        <p>Ou, se preferir, escaneie o QR Code abaixo com a câmera do seu celular:</p>
        <img src="${qrCodeDataUri}" alt="QR Code de Acesso" style="max-width: 200px; display: block;" />
      </div>
    `;

    await sendMail({
      to: emailDestino,
      subject: 'Acesso Compartilhado - VitalWatch',
      html: emailHtml,
    });

    return res.status(200).json({ message: 'Acesso compartilhado com sucesso por e-mail.' });
  } catch (error) {
    console.error('Erro ao compartilhar acesso:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
