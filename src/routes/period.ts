import { Course, School } from './../../node_modules/.prisma/client/index.d';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rota para criar um novo período
export async function createPeriod(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { order, userId } = request.body as { order: number; userId: string };

    // Verificar se a ordem do período e o ID do usuário estão presentes na requisição
    if (!order || !userId) {
      reply.status(400).send({ error: 'Period order and user ID are required' });
      return;
    }

    // Verificar se o usuário associado ao período existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      reply.status(404).send({ error: 'User not found' });
      return;
    }

    // Criar o período no banco de dados
    const newPeriod = await prisma.period.create({
      data: {
        order,
        user: { connect: { id: userId } }
      }
    });

    reply.status(201).send({ period: newPeriod });
  } catch (error) {
    console.error('Error creating period:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para excluir um período
export async function deletePeriod(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    // Verificar se o ID do período está presente na requisição
    if (!id) {
      reply.status(400).send({ error: 'Period ID is required' });
      return;
    }

    // Verificar se o período existe
    const existingPeriod = await prisma.period.findUnique({ where: { id } });
    if (!existingPeriod) {
      reply.status(404).send({ error: 'Period not found' });
      return;
    }

    // Excluir o período do banco de dados
    await prisma.period.delete({ where: { id } });

    reply.status(204).send();
  } catch (error) {
    console.error('Error deleting period:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para buscar todos os períodos
export async function getAllPeriods(request: FastifyRequest, reply: FastifyReply) {
  try {
    const periods = await prisma.period.findMany();
    reply.status(200).send({ periods });
  } catch (error) {
    console.error('Error fetching periods:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para buscar períodos por usuário
export async function getPeriodsByUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.params as { userId: string };
    if (!userId || typeof userId !== 'string') {
      reply.status(400).send({ error: 'Invalid or missing userId parameter' });
      return;
    }

    const periods = await prisma.period.findMany({
      where: {
        userId: userId
      }
    });

    reply.status(200).send({ periods });
  } catch (error) {
    console.error('Error fetching periods by user:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para buscar todos os períodos com matérias por usuário
export async function getPeriodsWithSubjectsByUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.params as { userId: string };
    if (!userId || typeof userId !== 'string') {
      reply.status(400).send({ error: 'Invalid or missing userId parameter' });
      return;
    }

    const periodsWithSubjects = await prisma.period.findMany({
      where: {
        userId: userId
      },
      include: {
        subjects: true
      }
    });

    reply.status(200).send({ periodsWithSubjects });
  } catch (error) {
    console.error('Error fetching periods with subjects by user:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function createSubjectPeriod(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, courseId, periodId } = request.body as { name: string; courseId: string; periodId: string };

    // Verificar se o nome da matéria, o ID do curso e o ID do período estão presentes na requisição
    if (!name || !courseId || !periodId) {
      reply.status(400).send({ error: 'Subject name, course ID, and period ID are required' });
      return;
    }

    // Verificar se o curso associado à matéria existe
    const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse) {
      reply.status(404).send({ error: 'Course not found' });
      return;
    }

    // Verificar se o período associado à matéria existe
    const existingPeriod = await prisma.period.findUnique({ where: { id: periodId } });
    if (!existingPeriod) {
      reply.status(404).send({ error: 'Period not found' });
      return;
    }

    // Criar a matéria no banco de dados, associando-a ao curso e ao período
    const newSubject = await prisma.subject.create({
      data: {
        name,
        course: { connect: { id: courseId } },
        Period: { connect: { id: periodId } }
      }
    });

    reply.status(201).send({ subject: newSubject });
  } catch (error) {
    console.error('Error creating subject:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para buscar informações sobre cursos, escolas, períodos e matérias
export async function getCoursesWithSchoolsPeriodsAndSubjects(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Consultar o banco de dados para obter informações sobre cursos, incluindo escolas, períodos e matérias associadas
    const coursesWithDetails = await prisma.course.findMany({
      include: {
        school: true,
        Subject: {
          include: {
            Period: true
          }
        }
      }
    });

    reply.status(200).send({ courses: coursesWithDetails });
  } catch (error) {
    console.error('Error fetching courses with details:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}

// Rota para buscar apenas os assuntos ligados ao período e curso específicos do aluno
export async function getSubjectsByStudentPeriodAndCourse(request: FastifyRequest, reply: FastifyReply) {
  try {
      const { userId, periodId, courseId } = request.params as { userId: string; periodId: string; courseId: string };
      if (!userId || !periodId || !courseId) {
          reply.status(400).send({ error: 'Invalid or missing parameters' });
          return;
      }

      // Verificar se o aluno está associado ao período especificado
      const userPeriod = await prisma.period.findFirst({
          where: {
              userId: userId,
              id: periodId
          }
      });
      if (!userPeriod) {
          reply.status(404).send({ error: 'Student is not associated with the specified period' });
          return;
      }

      // Verificar se o curso especificado está associado ao período
      const periodCourse = await prisma.course.findFirst({
          where: {
              id: courseId,
          }
      });
      if (!periodCourse) {
          reply.status(404).send({ error: 'Course not found or not associated with the specified period' });
          return;
      }

      // Consultar o banco de dados para obter os assuntos associados ao curso e período específicos
      const subjects = await prisma.subject.findMany({
          where: {
              courseId: courseId,
              periodId: periodId
          }
      });

      reply.status(200).send({ subjects });
  } catch (error) {
      console.error('Error fetching subjects by student, period, and course:', error);
      reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function getUserSubjectsFilteredByOrder(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
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
                              Subject: {
                                  where: {
                                      periodId: { not: null } // Filtrar apenas matérias com período associado
                                  },
                                  orderBy: {
                                      Period: {
                                          order: 'asc' // Ordenar matérias pelo order do período
                                      }
                                  }
                              }
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
