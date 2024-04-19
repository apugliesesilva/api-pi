import { PrismaClient } from '@prisma/client';
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const prisma = new PrismaClient();

interface ChangePasswordRequest {
  tokenPassword: string;
  newPassword: string;
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const changePasswordBodySchema = z.object({
    tokenPassword: z.string(),
    newPassword: z.string(),
  });

  const { tokenPassword, newPassword }: ChangePasswordRequest = changePasswordBodySchema.parse(
    request.body
  );

  try {
    // Verificar se existe uma solicitação de redefinição de senha com o token fornecido
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        tokenPassword,
      },
    });

    if (!passwordReset) {
      return reply.status(404).send({ message: 'Token inválido' });
    }

    // Alterar a senha do usuário correspondente
    await prisma.user.update({
      where: {
        email: passwordReset.email,
      },
      data: {
        password: newPassword, // Assumindo que a senha do usuário está armazenada no campo 'password'
      },
    });

    // Excluir a solicitação de redefinição de senha após a alteração da senha
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id, // Corrigido para passar o id do registro ao invés do tokenPassword
      },
    });

    return reply.status(200).send({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar a senha:', error);
    return reply.status(500).send({ message: 'Erro ao alterar a senha' });
  }
}
