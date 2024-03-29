import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rota para criar um novo subject
export async function createSubject(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { name, courseId } = request.body as { name: string, courseId: string };

        // Verificar se o nome e courseId estão presentes na requisição
        if (!name || !courseId) {
            reply.status(400).send({ error: 'Name and courseId are required' });
            return;
        }

        // Verificar se o curso associado existe
        const existingCourse = await prisma.course.findFirst({ where: { id: courseId } });
        if (!existingCourse) {
            reply.status(400).send({ error: 'Course not found' });
            return;
        }

        // Criar o subject no banco de dados
        const newSubject = await prisma.subject.create({
            data: {
                name,
                courseId
            }
        });

        reply.status(201).send({ subject: newSubject });
    } catch (error) {
        console.error('Error creating subject:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para buscar todos os subjects
export async function getAllSubjects(request: FastifyRequest, reply: FastifyReply) {
    try {
        const subjects = await prisma.subject.findMany();
        reply.status(200).send({ subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para deletar um subject por ID
export async function deleteSubject(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const { id } = request.params;

        // Deletar o subject do banco de dados
        await prisma.subject.delete({ where: { id } });

        reply.status(200).send({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

