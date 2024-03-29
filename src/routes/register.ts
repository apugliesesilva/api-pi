import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  surname: z.string(),
  studentRegister: z.string(),
  school: z.string(),
});

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, surname, studentRegister, school } = createUserSchema.parse(request.body);

  try {
    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ message: 'User already exists' });
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);
    const sessionId = randomUUID();

    // Busca a escola pelo nome
    const schoolRecord = await prisma.school.findFirst({ where: { name: school } });
    
    // Verifica se a escola foi encontrada
    if (!schoolRecord) {
      return reply.status(400).send({ error: 'School not found' });
    }

    // Criação do novo usuário
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname,
        studentRegister,
        school: { connect: { id: schoolRecord.id } }, 
        session_id: sessionId
      },
    });

    return reply.status(201).send();
  } catch (error: any) {
    console.error('Error registering user:', error);
    return reply.status(500).send({ error: 'Internal server error', message: error.message });
  }
}
