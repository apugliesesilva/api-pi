import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function schoolRoutes(app: FastifyInstance) {
    app.post('/schools', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { name } = request.body as { name: string };

            if (!name) {
                reply.status(400).send({ error: 'School name is required' });
                return;
            }

            const existingSchool = await prisma.school.findFirst({ where: { name } });
            if (existingSchool) {
                reply.status(400).send({ error: 'School with the same name already exists' });
                return;
            }

            const newSchool = await prisma.school.create({ data: { name } });

            reply.status(201).send({ school: newSchool });
        } catch (error) {
            console.error('Error creating school:', error);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });

    app.get('/schools', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const schools = await prisma.school.findMany();
            reply.status(200).send({ schools });
        } catch (error) {
            console.error('Error fetching schools:', error);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { name } = request.body as { name: string };

        if (!name) {
            reply.status(400).send({ error: 'School name is required' });
            return;
        }

        const existingSchool = await prisma.school.findFirst({ where: { name } });
        if (existingSchool) {
            reply.status(400).send({ error: 'School with the same name already exists' });
            return;
        }

        const newSchool = await prisma.school.create({ data: { name } });

        reply.status(201).send({ school: newSchool });
    } catch (error) {
        console.error('Error creating school:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}
