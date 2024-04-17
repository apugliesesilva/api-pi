import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rota para criar um novo curso
export async function createCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { name, schoolId } = request.body as { name: string; schoolId: string };

        // Verificar se o nome do curso e o ID da escola estão presentes na requisição
        if (!name || !schoolId) {
            reply.status(400).send({ error: 'Course name and school ID are required' });
            return;
        }

        // Verificar se a escola associada ao curso existe
        const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!existingSchool) {
            reply.status(404).send({ error: 'School not found' });
            return;
        }

        // Criar o curso no banco de dados
        const newCourse = await prisma.course.create({
            data: {
                name,
                school: { connect: { id: schoolId } }
            }
        });

        reply.status(201).send({ course: newCourse });
    } catch (error) {
        console.error('Error creating course:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para excluir um curso
export async function deleteCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };

        // Verificar se o ID do curso está presente na requisição
        if (!id) {
            reply.status(400).send({ error: 'Course ID is required' });
            return;
        }

        // Verificar se o curso existe
        const existingCourse = await prisma.course.findUnique({ where: { id } });
        if (!existingCourse) {
            reply.status(404).send({ error: 'Course not found' });
            return;
        }

        // Excluir o curso do banco de dados
        await prisma.course.delete({ where: { id } });

        reply.status(204).send();
    } catch (error) {
        console.error('Error deleting course:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Rota para buscar todos os cursos
export async function getAllCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
        const courses = await prisma.course.findMany();
        reply.status(200).send({ courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getCoursesBySchool(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { schoolId } = request.params as { schoolId: string };
        if (!schoolId || typeof schoolId !== 'string') {
            reply.status(400).send({ error: 'Invalid or missing schoolId parameter' });
            return;
        }

        const courses = await prisma.course.findMany({
            where: {
                schoolId: {
                    equals: schoolId
                }
            }
        });

        reply.status(200).send({ courses });
    } catch (error) {
        console.error('Error fetching courses by school:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

export async function getCoursesWithSubjectsBySchool(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { schoolId } = request.params as { schoolId: string };
        if (!schoolId || typeof schoolId !== 'string') {
            reply.status(400).send({ error: 'Invalid or missing schoolId parameter' });
            return;
        }

        const coursesWithSubjects = await prisma.course.findMany({
            where: {
                schoolId: schoolId
            },
            include: {
                Subject: true
            }
        });

        reply.status(200).send({ coursesWithSubjects });
    } catch (error) {
        console.error('Error fetching courses with subjects by school:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}
