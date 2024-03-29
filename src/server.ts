import fastify from "fastify";
import cookie from '@fastify/cookie';
import fastifyJwt from "@fastify/jwt";
import { adminRoutes, usersRoutes } from "./routes/routes";
import { config } from 'dotenv';
config();

const app = fastify();

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET as string,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '10m',
  },
})
app.register(cookie);
console.log(process.env.JWT_SECRET)
app.register(usersRoutes, { prefix: '/users' })
app.register(adminRoutes, { prefix: '/admin' })



app
  .listen({
    port: 3001,
  })
  .then(() => {
    console.log("ON THE AIR! 🎙️");
  });