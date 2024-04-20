import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';


const prisma = new PrismaClient();

interface ForgetPasswordUseCaseRequest {
  email: string;
}

interface ForgetPasswordUseCaseResponse {
  message: string;
}

export class ForgetPasswordUseCase {
  async execute({
    email,
  }: ForgetPasswordUseCaseRequest): Promise<ForgetPasswordUseCaseResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Gerar token único (pode ser mais seguro dependendo da aplicação)
    const tokenPassword = Math.random().toString(36).substr(2);

    // Salvar o token no banco de dados
    await prisma.passwordReset.create({
      data: {
        email: email,
        tokenPassword: tokenPassword,
      },
    });

    // Enviar email com o link de redefinição de senha
    const resetLink = `https://pi-unicap.vercel.app/reset-password/${tokenPassword}`;
    await sendResetPasswordEmail(email, resetLink);

    return {
      message: 'Email enviado com sucesso',
    };
  }
}

async function sendResetPasswordEmail(email: string, resetLink: string) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailersend.net',
    port: 587,
    secure: false,
    auth: {
      user: 'MS_pjx2up@trial-pq3enl6y9d7g2vwr.mlsender.net',
      pass: 'I4w6YB47PQZ1pAGi',
    },
    tls: {
      rejectUnauthorized: false // Aceitar certificados autoassinados
    },
  });

  await transporter.sendMail({
    from: 'MS_pjx2up@trial-pq3enl6y9d7g2vwr.mlsender.net',
    to: email,
    subject: 'Redefinir senha - Sistema de Avaliação',
    html: `<b> </b>Para redefinir sua senha,</b> <a href="${resetLink}">clique aqui</a>.<br><img src="https://i.imgur.com/mEo6WvO.png" alt="Sistema de Avaliação Logo"/>`,
  });
  
}

export async function forgetPassword(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const forgetPasswordBodySchema = z.object({
    email: z.string().email(),
  });

  const { email } = forgetPasswordBodySchema.parse(request.body);

  try {
    const forgetPasswordUseCase = new ForgetPasswordUseCase();

    await forgetPasswordUseCase.execute({
      email,
    });

    return reply.status(200).send({ message: 'Email enviado com sucesso' });
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return reply.status(404).send({ message: 'Usuário não encontrado' });
    }

    throw err;
  }
}
