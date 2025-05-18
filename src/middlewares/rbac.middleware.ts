import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';

const prisma = new PrismaClient();

export const checkRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!allowedRoles.includes(user.role.name)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      // Add user to request object for use in route handlers
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role.name
      };
      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};