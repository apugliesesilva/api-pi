import { PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

const prisma = new PrismaClient();

export async function profile(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Busca o perfil do usuário diretamente do Prisma
    const user = await prisma.user.findUnique({
      where: { id: (request.user as { sub: string }).sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Se o usuário não for encontrado, retorne um erro
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    // Retorne o perfil do usuário sem o campo password_hash
    return reply.status(200).send({
      user: {
        ...user,
        password_hash: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return reply.status(500).send({ error: 'Internal server error', message: error.message });
  }
}
