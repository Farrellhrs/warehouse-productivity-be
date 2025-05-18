import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodType } from 'zod';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

export const validate = (schema: ZodType) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Validation error', {
        errors: error.errors,
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      const errorMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      next(new AppError(400, `Validation error: ${errorMessage}`));
    } else {
      next(error);
    }
  }
}; 