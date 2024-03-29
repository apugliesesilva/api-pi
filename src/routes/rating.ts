import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para criar um novo rating
export async function createRating(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { scores, subjectId, userId } = request.body as {
            scores: { sentence: string; score: number }[];
            subjectId: string;
            userId: string;
        };

        // Verificar se todos os campos necessários estão presentes na requisição
        if (!scores || !subjectId || !userId) {
            reply.status(400).send({ error: 'Scores, subjectId, and userId are required' });
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

        // Criar os ratings no banco de dados
        const newRatings = await Promise.all(
            scores.map(async ({ sentence, score }) => {
                return prisma.rating.create({
                    data: {
                        sentence,
                        score,
                        subjectId,
                        userId,
                    },
                });
            })
        );

        reply.status(201).send({ ratings: newRatings });
    } catch (error) {
        console.error('Error creating ratings:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para buscar todos os ratings
export async function getAllRatings(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ratings = await prisma.rating.findMany();
        reply.status(200).send({ ratings });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para deletar um rating por ID
export async function deleteRating(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const { id } = request.params;

        // Deletar o rating do banco de dados
        await prisma.rating.delete({ where: { id } });

        reply.status(200).send({ message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

