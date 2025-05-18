import { Request, Response, Router } from 'express';
import { register, login, refreshToken, logout } from './auth.service';
import { AppError } from '../../middlewares/error.middleware';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, roleId } = req.body;

    const user = await register({
      username,
      email,
      password,
      fullName,
      roleId,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const result = await login(usernameOrEmail, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    const result = await refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const logoutHandler = async (req: Request, res: Response) => {
  try {
    await logout(Number(req.user!.id));

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};