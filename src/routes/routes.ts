import { FastifyInstance, FastifyReply } from 'fastify'
import { verifyJwt } from '../middlewares/verify-jwt'
import { verifyUserRole } from '../middlewares/verify-user-role'

// users
import { authenticate } from './authenticate'
import { register } from './register'
import { profile } from './profile'
import { refresh } from './refresh'
import { forgetPassword } from './password'

// admin

import { schoolRoutes, create } from './school'
import { createCourse, getAllCourses, deleteCourse, getCoursesBySchool, getCoursesWithSubjectsBySchool, getCoursePerformanceBySubject } from './course'
import { createSubject, deleteSubject, getAllSubjects } from './subject'
import { createRating, getAverageScoresBySubject, getRatingCountByDay, getRatingDistribution, getRatingMetricsBySentence } from './rating'
import { getUsersCountBySchool, getUserDetails, getUsers, getUserSubjects, getUsersCount, getUsersWithRatings, getUsersAll, getTen } from './insights'
import { changePassword } from './changepassword'
import { FastifyRequest } from 'fastify/types/request'
import { createComment, getAllComments } from './comment'
import { obterDados } from './pdftwo'
import { createPeriod, deletePeriod, getAllPeriods, getPeriodsByUser, getPeriodsWithSubjectsByUser, createSubjectPeriod, getCoursesWithSchoolsPeriodsAndSubjects, getSubjectsByStudentPeriodAndCourse, getUserSubjectsFilteredByOrder } from './period';


export async function usersRoutes(app: FastifyInstance) {
  app.post('/register', register)
  app.post('/sessions', authenticate)

  app.post('/forget-password', forgetPassword)
  app.post('/change-password', changePassword)

  app.patch('/token/refresh', refresh)

  app.post('/rating', createRating)

  app.post('/comments', createComment)
  app.get('/comments', getAllComments)

  /** Authenticated */
  app.get('/me', { onRequest: [verifyJwt] }, profile)


  /** Insights USER */

  app.get('/subjectsbyuser/:id', getUserSubjects)
  app.get('/subjects-filtered-by-order/:id', getUserSubjectsFilteredByOrder);
  app.delete('/delsub/:id', deleteSubject);

}


export async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt)

  app.post('/school', { onRequest: [verifyUserRole('ADMIN')] }, create)

  app.post('/courses', { onRequest: [verifyUserRole('ADMIN')] }, createCourse);
  app.delete('/courses/:id', { onRequest: [verifyUserRole('ADMIN')] }, deleteCourse);
  app.get('/courses', { onRequest: [verifyUserRole('ADMIN')] }, getAllCourses);

  app.post('/subjects', { onRequest: [verifyUserRole('ADMIN')] }, createSubject);
  app.get('/subjects', { onRequest: [verifyUserRole('ADMIN')] }, getAllSubjects);



  app.get('/getusers', { onRequest: [verifyUserRole('ADMIN')] }, getUsers)
  app.get('/totalusers', { onRequest: [verifyUserRole('ADMIN')] }, getUsersCount)
  app.get('/userwithratings', { onRequest: [verifyUserRole('ADMIN')] }, getUsersWithRatings)
  app.get('/getuserdetails', { onRequest: [verifyUserRole('ADMIN')] }, getUserDetails)
  app.get('/getusersbyschool', { onRequest: [verifyUserRole('ADMIN')] }, getUsersCountBySchool)
  app.get('/getcoursesbyschool/:schoolId', { onRequest: [verifyUserRole('ADMIN')] }, getCoursesBySchool)
  app.get('/getcourseswsubjects/:schoolId', { onRequest: [verifyUserRole('ADMIN')] }, getCoursesWithSubjectsBySchool)
  app.get('/getscorebysubject', { onRequest: [verifyUserRole('ADMIN')] }, getAverageScoresBySubject)
  app.get('/getratingbyday', { onRequest: [verifyUserRole('ADMIN')] }, getRatingCountByDay)
  app.get('/getratingdistribution', { onRequest: [verifyUserRole('ADMIN')] }, getRatingDistribution)
  app.get('/getcourseperfom', { onRequest: [verifyUserRole('ADMIN')] }, getCoursePerformanceBySubject)
  app.get('/getratingmetrics', getRatingMetricsBySentence)

  app.get('/getdata', { onRequest: [verifyUserRole('ADMIN')] }, obterDados)

  app.get('/getten', { onRequest: [verifyUserRole('ADMIN')] }, getTen)

  app.get('/getusersall', { onRequest: [verifyUserRole('ADMIN')] }, getUsersAll)

  app.post('/', { onRequest: [verifyUserRole('ADMIN')] }, create)


    // Rotas para períodos
    app.post('/create-period', { onRequest: [verifyUserRole('ADMIN')] }, createPeriod);
    app.delete('/delete-period/:id', { onRequest: [verifyUserRole('ADMIN')] }, deletePeriod);
    app.get('/all-periods', { onRequest: [verifyUserRole('ADMIN')] }, getAllPeriods);
    app.get('/periods-by-user/:userId', { onRequest: [verifyUserRole('ADMIN')] }, getPeriodsByUser);
    app.get('/periods-with-subjects-by-user/:userId', { onRequest: [verifyUserRole('ADMIN')] }, getPeriodsWithSubjectsByUser);
  
    // Rota para criar uma matéria
    app.post('/create-subject', { onRequest: [verifyUserRole('ADMIN')] }, createSubjectPeriod);
  
    // Rota para buscar informações sobre cursos, escolas, períodos e matérias
    app.get('/courses-schools-periods-subjects', { onRequest: [verifyUserRole('ADMIN')] }, getCoursesWithSchoolsPeriodsAndSubjects);
  
    // Rota para buscar apenas os assuntos ligados ao período e curso específicos do aluno
    app.get('/subjects-by-student-period-course/:userId/:periodId/:courseId', { onRequest: [verifyUserRole('ADMIN')] }, getSubjectsByStudentPeriodAndCourse);
  
}

