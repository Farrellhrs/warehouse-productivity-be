import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import { AppError } from '../middlewares/error.middleware';

interface TokenPayload {
  id: number;
  username: string;
  role?: string;
}

// In-memory token blacklist (in production, use Redis or similar)
const tokenBlacklist = new Set<string>();

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  if (tokenBlacklist.has(token)) {
    throw new AppError(401, 'Token has been revoked');
  }
  
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Access token has expired');
    }
    throw new AppError(401, 'Invalid access token');
  }
};

export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  if (tokenBlacklist.has(token)) {
    throw new AppError(401, 'Refresh token has been revoked');
  }

  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Refresh token has expired');
    }
    throw new AppError(401, 'Invalid refresh token');
  }
};

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
}; 