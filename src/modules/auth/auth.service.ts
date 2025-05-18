import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  blacklistToken 
} from '../../utils/jwt';
import { AppError } from '../../middlewares/error.middleware';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  roleId: z.number().int().positive(),
});

export const register = async (data: z.infer<typeof registerSchema>) => {
  // Check if username already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email }
      ]
    },
  });

  if (existingUser) {
    if (existingUser.username === data.username) {
      throw new AppError(409, 'Username already registered');
    }
    if (existingUser.email === data.email) {
      throw new AppError(409, 'Email already registered');
    }
  }

  // Validate roleId (only allow viewer or editor)
  const role = await prisma.role.findUnique({
    where: { id: data.roleId }
  });

  if (!role || !['viewer', 'editor'].includes(role.name)) {
    throw new AppError(400, 'Invalid role. Only viewer and editor roles are allowed.');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user with role
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      roleId: data.roleId
    },
    include: {
      role: true
    }
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role.name
  };
};

export const login = async (usernameOrEmail: string, password: string) => {
  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    },
    include: {
      role: true
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    username: user.username,
    role: user.role.name
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    username: user.username
  });

  // Store refresh token in database (optional, for token rotation)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token: string) => {
  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(token);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        role: true
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Blacklist the old refresh token
    blacklistToken(token);

    // Generate new tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role.name
    });
    const newRefreshToken = generateRefreshToken({ 
      id: user.id, 
      username: user.username 
    });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid refresh token');
  }
};

export const logout = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { refreshToken: true }
  });

  if (user?.refreshToken) {
    // Blacklist the refresh token
    blacklistToken(user.refreshToken);
    
    // Clear refresh token from database
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }

  return true;
}; 