import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2).max(100),
    roleId: z.number().int().positive(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    usernameOrEmail: z.string({
      required_error: 'usernameOrEmail is required',
    }),
    password: z.string({
      required_error: 'password is required',
    }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'refreshToken is required',
    }),
  }),
}); 