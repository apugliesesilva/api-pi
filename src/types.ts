import { FastifyRequest } from 'fastify';
import { UserRole } from '@prisma/client';

interface CustomRequest extends FastifyRequest {
    user?: {
        id: string;
        name: string;
        role: UserRole;
=    };
}

export { CustomRequest };
