import { FastifyInstance, FastifyRequest, FastifyReply, RouteHandlerMethod } from 'fastify';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';

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
export async function deleteRating(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };

        // Verificar se o ID do curso está presente na requisição
        if (!id) {
            reply.status(400).send({ error: 'Rating ID is required' });
            return;
        }

        // Verificar se o curso existe
        const existingCourse = await prisma.rating.findUnique({ where: { id } });
        if (!existingCourse) {
            reply.status(404).send({ error: 'Rating not found' });
            return;
        }

        // Excluir o curso do banco de dados
        await prisma.rating.delete({ where: { id } });

        reply.status(204).send();
    } catch (error) {
        console.error('Error deleting rating:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}
// Rota para buscar a média dos scores por subject
export async function getAverageScoresBySubject(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ratings = await prisma.rating.groupBy({
            by: ['subjectId'],
            _avg: {
                score: true,
            },
        });

        const averageScoresBySubject: Record<string, number> = {};

        ratings.forEach((rating: any) => {
            averageScoresBySubject[rating.subjectId] = rating._avg.score;
        });

        reply.status(200).send({ averageScoresBySubject });
    } catch (error) {
        console.error('Error fetching average scores by subject:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para buscar a quantidade de ratings por dia
export async function getRatingCountByDay(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ratings = await prisma.rating.findMany();
        
        // Mapear as datas de criação dos ratings para obter apenas a parte do dia
        const ratingsByDay = ratings.reduce((acc: Record<string, number>, rating) => {
            const date = rating.createdAt.toISOString().split('T')[0]; // Obter a parte da data
            acc[date] = (acc[date] || 0) + 1; // Incrementar o contador para esse dia
            return acc;
        }, {});

        reply.status(200).send({ ratingCountByDay: ratingsByDay });
    } catch (error) {
        console.error('Error fetching rating count by day:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getRatingDistribution(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consultar o banco de dados para obter a contagem de ratings para cada score
        const ratingDistribution = await prisma.rating.groupBy({
            by: ['score'],
            _count: true,
        });

        // Criar um objeto para armazenar a distribuição de scores
        const distributionData: Record<number, number> = {};

        // Preencher o objeto com a contagem de ratings para cada score
        ratingDistribution.forEach((item: any) => {
            distributionData[item.score] = item._count;
        });

        // Enviar a distribuição de scores como resposta
        reply.status(200).send({ ratingDistribution: distributionData });
    } catch (error) {
        console.error('Error fetching rating distribution:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para obter métricas de rating por sentence
export async function getRatingMetricsBySentence(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { courseId } = request.params as { courseId: string };

        // Consultar o banco de dados para obter todos os ratings associados ao courseId
        const ratings = await prisma.rating.findMany({
            where: {
                subject: {
                    course: {
                        id: courseId,
                    },
                },
            },
            include: {
                subject: true,
            },
        });

        // Objeto para armazenar as métricas por sentence
        const metricsBySentence: Record<string, {
            averageScore: number;
            scoreDistribution: Record<number, number>;
            numberOfResponses: number;
            percentageByScore: Record<number, number>;
        }> = {};

        // Iterar sobre os ratings e calcular as métricas por sentence
        ratings.forEach((rating: any) => {
            const { sentence, score } = rating;
            const { name } = rating.subject;

            // Inicializar as métricas se ainda não estiverem presentes
            if (!metricsBySentence[sentence]) {
                metricsBySentence[sentence] = {
                    averageScore: 0,
                    scoreDistribution: {
                        0: 0,
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                    },
                    numberOfResponses: 0,
                    percentageByScore: {
                        0: 0,
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                    },
                };
            }

            // Atualizar as métricas com base no rating atual
            metricsBySentence[sentence].averageScore += score;
            metricsBySentence[sentence].scoreDistribution[score]++;
            metricsBySentence[sentence].numberOfResponses++;
        });

        // Calcular a média dos scores e a porcentagem por score para cada sentence
        Object.keys(metricsBySentence).forEach((sentence) => {
            const { averageScore, scoreDistribution, numberOfResponses } = metricsBySentence[sentence];

            // Calcular a média dos scores
            metricsBySentence[sentence].averageScore = averageScore / numberOfResponses;

            // Calcular a porcentagem por score
            Object.keys(scoreDistribution).forEach((score) => {
                const count = scoreDistribution[parseInt(score)];
                metricsBySentence[sentence].percentageByScore[parseInt(score)] = (count / numberOfResponses) * 100;
            });
        });

        // Enviar as métricas de rating por sentence como resposta
        reply.status(200).send({ ratingMetricsBySentence: metricsBySentence });
    } catch (error) {
        console.error('Error fetching rating metrics by sentence:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

