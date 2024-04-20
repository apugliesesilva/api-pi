import { PrismaClient } from '@prisma/client';
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface ChangePasswordRequest {
  tokenPassword: string;
  newPassword: string;
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const changePasswordBodySchema = z.object({
    tokenPassword: z.string(),
    newPassword: z.string().min(6), // Certifique-se de que a nova senha tenha pelo menos 6 caracteres
  });

  try {
    const { tokenPassword, newPassword }: ChangePasswordRequest = changePasswordBodySchema.parse(
      request.body
    );

    // Verificar se existe uma solicitação de redefinição de senha com o token fornecido
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        tokenPassword,
      },
    });

    if (!passwordReset) {
      return reply.status(404).send({ message: 'Token inválido' });
    }

    // Hash da nova senha antes de atualizar no banco de dados
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Alterar a senha do usuário correspondente
    await prisma.user.update({
      where: {
        email: passwordReset.email,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    // Excluir a solicitação de redefinição de senha após a alteração da senha
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id,
      },
    });

    return reply.status(200).send({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar a senha:', error);
    return reply.status(500).send({ message: 'Erro ao alterar a senha' });
  }
}
