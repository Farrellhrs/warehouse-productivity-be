import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: {
          select: {
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform the response to match the swagger schema
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name
    }));

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: transformedUsers
    });
  } catch (error) {
    next(new AppError(500, 'Failed to retrieve users'));
  }
}; 