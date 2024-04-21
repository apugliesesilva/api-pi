import { FastifyRequest, FastifyReply } from 'fastify';
import { Prisma, PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();





export async function getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { page = 1, limit = 10 } = request.query as { page?: number, limit?: number };

        // Calcula o valor de 'skip' baseado na página e limite
        const skip = (page - 1) * limit;

        // Consulta os usuários com paginação por offset
        const users = await prisma.user.findMany({
            select: {
                school: { select: { name: true } },
                surname: true
            },
            skip, // Pula 'skip' registros
            take: limit // Retorna 'limit' registros
        });

        if (users.length === 0) {
            reply.status(404).send({ error: 'Users not found' });
        } else {
            reply.status(200).send({ users });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getUsersAll(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consulta todos os usuários sem paginação
        const users = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                surname: true,
                school: { select: { name: true } },
            },
        });

        if (users.length === 0) {
            reply.status(404).send({ error: 'Users not found' });
        } else {
            reply.status(200).send({ users });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}


export async function getUsersTen(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consulta os últimos 10 usuários criados
        const users = await prisma.user.findMany({
            select: {
                name: true,
                surname: true,
                email: true,
                school: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' }, // Ordena por data de criação em ordem decrescente
            take: 10 // Retorna os últimos 10 usuários
        });

        if (users.length === 0) {
            reply.status(404).send({ error: 'Users not found' });
        } else {
            reply.status(200).send({ users });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}


export async function getUsersCount(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consulta o número total de usuários
        const totalUsers = await prisma.user.count();

        // Retorna apenas o número total de usuários
        reply.status(200).send({ totalUsers });
    } catch (error) {
        console.error('Error fetching total number of users:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getUsersWithRatings(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consulta o número de usuários que têm ratings
        const usersWithRatingsCount = await prisma.rating.aggregate({
            _count: {
                userId: true,
            },
        });

        // Extrai o número total de usuários com ratings
        const totalUsersWithRatings = usersWithRatingsCount._count.userId;

        // Retorna apenas o número total de usuários que têm ratings
        reply.status(200).send({ totalUsersWithRatings });
    } catch (error) {
        console.error('Error fetching number of users with ratings:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}


export async function getUserDetails(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { page = 1, limit = 10 } = request.query as { page?: number, limit?: number };

        // Calcula o valor de 'skip' baseado na página e limite
        const skip = (page - 1) * limit;

        // Consulta os usuários com paginação
        let users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                studentRegister: true,
                role: true,
                createdAt: true,
                school: { select: { name: true } },
            },
            skip, // Pula 'skip' registros
            take: limit // Retorna 'limit' registros
        });

        // Calcular o tempo desde a criação da conta para cada usuário
        const currentTime = new Date();
        users = users.map(user => {
            const accountAge = Math.floor((currentTime.getTime() - user.createdAt.getTime()) / (1000 * 3600 * 24)); // Calcula em dias
            return { ...user, accountAge };
        });

        if (users.length === 0) {
            reply.status(404).send({ error: 'Users not found' });
        } else {
            reply.status(200).send({ users });
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getUsersCountBySchool(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Consulta a quantidade de usuários por escola
        const usersCountBySchool = await prisma.school.findMany({
            select: {
                id: true,
                name: true,
                User: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // Mapeia os resultados para calcular o número de usuários por escola
        const formattedResults = usersCountBySchool.map(school => ({
            id: school.id,
            name: school.name,
            usersCount: school.User.length
        }));

        // Retorna os resultados
        reply.status(200).send({ usersCountBySchool: formattedResults });
    } catch (error) {
        console.error('Error fetching users count by school:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}


export async function getUserSubjects(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const userId = request.params.id; // Extrai o ID da rota

        // Buscar o usuário pelo ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                school: {
                    select: {
                        Course: {
                            select: {
                                Subject: true,

                            }
                        }
                    }
                } // Incluir os subjects associados ao usuário
            },
        });

        if (!user) {
            return reply.status(404).send({ message: 'User not found' });
        }

        return reply.status(200).send(user.school.Course);
    } catch (error) {
        console.error('Error fetching subjects by user ID:', error);
        return reply.status(500).send({ error: 'Internal server error' });
    }
}
