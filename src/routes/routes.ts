import { FastifyInstance } from 'fastify'
import { verifyJwt } from '../middlewares/verify-jwt'
import { verifyUserRole } from '../middlewares/verify-user-role'

// users
import { authenticate } from './authenticate'
import { register } from './register'
import { profile } from './profile'
import { refresh } from './refresh'

// admin

import { schoolRoutes, create } from './school'
import { createCourse, getAllCourses, deleteCourse } from './course'
import { createSubject, getAllSubjects } from './subject'
import { createRating } from './rating'


export async function usersRoutes(app: FastifyInstance) {
  app.post('/register', register)
  app.post('/sessions', authenticate)

  app.patch('/token/refresh', refresh)

  app.post('/rating', createRating)
  /** Authenticated */
  app.get('/me', { onRequest: [verifyJwt] }, profile)
}


export async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt)

  app.post('/school', { onRequest: [verifyUserRole('ADMIN')] }, create)

  app.post('/courses', { onRequest: [verifyUserRole('ADMIN')] }, createCourse);
  app.delete('/courses/:id', { onRequest: [verifyUserRole('ADMIN')] }, deleteCourse);
  app.get('/courses', { onRequest: [verifyUserRole('ADMIN')] }, getAllCourses);

  app.post('/subjects', { onRequest: [verifyUserRole('ADMIN')] }, createSubject);
  app.get('/subjects', { onRequest: [verifyUserRole('ADMIN')] }, getAllSubjects);

  app.post('/', { onRequest: [verifyUserRole('ADMIN')] }, create)
}