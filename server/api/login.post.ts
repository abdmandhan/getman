import { email, z } from "zod";
import { prisma } from "~~/server/utils/db";
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { username, password } = z
    .object({
      username: z.string().min(1),
      password: z.string().min(1),
    })
    .parse(body);

  const user = await prisma.user.findFirst({
    where: {
      email: username,
    },
  });
  console.log('user', user)

  if (!user || !user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid username or password",
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid username or password",
    });
  }

  await setUserSession(event, {
    user: {
      username: user.email ?? '',
    },
    loggedInAt: Date.now(),
    secure: false,
  }, {
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      secure: false,
      sameSite: 'lax',
      httpOnly: true,
    }
  });

  return { success: true };
});

