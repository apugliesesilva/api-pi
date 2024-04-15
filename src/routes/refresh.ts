import { FastifyReply, FastifyRequest } from 'fastify'

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify({ onlyCookie: true })

  const user = request.user as { role: string; sub: string };
  const { role } = user;

  const token = await reply.jwtSign(
    { role },
    {
      sign: {
        sub: user.sub,
      },
    },
  );
  
  const refreshToken = await reply.jwtSign(
    { role },
    {
      sign: {
        sub: user.sub,
        expiresIn: '7d',
      },
    },
  );
  
  return reply
    .setCookie('refreshToken', refreshToken, {
      path: '/',
      secure: true,
      sameSite: true,
      httpOnly: true,
    })
    .status(200)
    .send({
      token,
      role,
    })
}