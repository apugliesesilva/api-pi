import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export async function createComment(request: FastifyRequest, reply: FastifyReply) {
  try {
      const { content, subjectId, userId } = request.body as {
          content: string;
          subjectId: string;
          userId: string;
      };

      // Verificar se todos os campos necessários estão presentes na requisição
      if (!content || !subjectId || !userId) {
          reply.status(400).send({ error: 'Content, subjectId, and userId are required' });
          return;
      }

      // Verificar se o subject associado existe
      const existingSubject = await prisma.subject.findFirst({ where: { id: subjectId } });
      if (!existingSubject) {
          reply.status(400).send({ error: 'Subject not found' });
          return;
      }

      // Verificar se o usuário associado existe
      const existingUser = await prisma.user.findFirst({ where: { id: userId } });
      if (!existingUser) {
          reply.status(400).send({ error: 'User not found' });
          return;
      }

      // Criar o comentário no banco de dados
      const newComment = await prisma.comment.create({
          data: {
              content,
              subjectId,
              userId,
          },
      });

      reply.status(201).send({ comment: newComment });
  } catch (error) {
      console.error('Error creating comment:', error);
      reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function getAllComments(request: FastifyRequest, reply: FastifyReply) {
  try {
      // Buscar todos os comentários no banco de dados
      const allComments = await prisma.comment.findMany({
          include: { 
              user: {
                select: {
                  id: true,                
                },
              },
              subject: true, 
              // Incluindo detalhes do assunto relacionado
            },

      });

      reply.status(200).send({ comments: allComments });
  } catch (error) {
      console.error('Error getting all comments:', error);
      reply.status(500).send({ error: 'Internal server error' });
  }
}
