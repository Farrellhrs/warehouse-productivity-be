import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the allowed HTTP methods for each role
const rolePermissions = {
  viewer: ['GET'],
  editor: ['GET', 'POST', 'PUT', 'DELETE']
};

export const checkRolePermission = (requiredMethod: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user's role from the authenticated user
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      if (!user || !user.role) {
        return res.status(403).json({ message: 'User role not found' });
      }

      const userRole = user.role.name;
      
      // Validate that the role is either viewer or editor
      if (!['viewer', 'editor'].includes(userRole)) {
        return res.status(403).json({ message: 'Invalid role' });
      }

      const allowedMethods = rolePermissions[userRole as keyof typeof rolePermissions];

      if (!allowedMethods || !allowedMethods.includes(requiredMethod)) {
        return res.status(403).json({
          message: `Role '${userRole}' is not authorized to perform ${requiredMethod} operations`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper middleware for common HTTP methods
export const canView = checkRolePermission('GET');
export const canCreate = checkRolePermission('POST');
export const canUpdate = checkRolePermission('PUT');
export const canDelete = checkRolePermission('DELETE'); 