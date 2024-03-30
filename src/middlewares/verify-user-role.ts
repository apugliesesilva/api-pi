import { FastifyReply, FastifyRequest } from 'fastify'

export function verifyUserRole(roleToVerify: 'ADMIN' | 'STUDENT') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || typeof request.user !== 'object') {
      return reply.status(401).send({ message: 'Não autorizado 1.' });
    }

    const { role } = request.user as { role: 'ADMIN' | 'STUDENT' };

    if (role !== roleToVerify) {
      return reply.status(401).send({ message: 'Não autorizado 2.' });
    }
  }
}
