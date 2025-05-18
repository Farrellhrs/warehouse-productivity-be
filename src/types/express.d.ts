import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: Role;
      };
    }
  }
} 