import { Request, Response } from 'express';
import {
  createOrUpdateDailyLog,
  getDailyLogs,
  getDailyLogById,
  deleteDailyLog,
  getUserDailyLogs,
  getDailyLogStats,
} from './dailyLog.service';
import { AppError } from '../../middlewares/error.middleware';

// TODO: Implement POST /daily-logs endpoint to create or update a daily log
// - Validate input data (logDate, isPresent, binningCount, pickingCount)
// - Check if user exists and has operator role
// - Create or update daily log in database
// - Log activity in activity_logs table
// - Return created/updated daily log

// TODO: Implement GET /daily-logs endpoint to list daily logs
// - Add pagination support (page, limit)
// - Add date range filtering (startDate, endDate)
// - Add user filtering (userId)
// - Return paginated list of daily logs with user details

// TODO: Implement GET /daily-logs/:id endpoint to get a specific daily log
// - Validate log ID
// - Check if log exists
// - Return daily log with user details

// TODO: Implement DELETE /daily-logs/:id endpoint to delete a daily log
// - Validate log ID
// - Check if log exists
// - Check if user has permission to delete
// - Delete log from database
// - Log activity in activity_logs table

// TODO: Implement GET /daily-logs/user/:userId endpoint to get user's daily logs
// - Validate user ID
// - Check if user exists
// - Add pagination support
// - Add date range filtering
// - Return paginated list of user's daily logs 

export const createOrUpdateDailyLogController = async (req: Request, res: Response) => {
  try {
    const { logDate, isPresent, binningCount, pickingCount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Validate required fields
    if (!logDate || typeof isPresent !== 'boolean') {
      throw new AppError(400, 'logDate and isPresent are required');
    }

    // Validate numeric fields if present
    if (binningCount !== undefined && (isNaN(binningCount) || binningCount < 0)) {
      throw new AppError(400, 'binningCount must be a non-negative number');
    }
    if (pickingCount !== undefined && (isNaN(pickingCount) || pickingCount < 0)) {
      throw new AppError(400, 'pickingCount must be a non-negative number');
    }

    const dailyLog = await createOrUpdateDailyLog(
      userId,
      new Date(logDate),
      isPresent,
      binningCount,
      pickingCount
    );

    res.status(200).json({
      success: true,
      message: 'Daily log created/updated successfully',
      data: dailyLog
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

export const getDailyLogsController = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    // Validate pagination parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      throw new AppError(400, 'Invalid pagination parameters');
    }

    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new AppError(400, 'Both startDate and endDate must be provided for date filtering');
    }

    const result = await getDailyLogs(
      page,
      limit,
      startDate,
      endDate,
      userId
    );

    res.status(200).json({
      success: true,
      data: result
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

export const getDailyLogByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      throw new AppError(400, 'Invalid log ID');
    }

    const dailyLog = await getDailyLogById(logId);
    res.status(200).json({
      success: true,
      data: dailyLog
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

export const deleteDailyLogController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const logId = parseInt(id);

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (isNaN(logId)) {
      throw new AppError(400, 'Invalid log ID');
    }

    const result = await deleteDailyLog(logId, userId);
    res.status(200).json({
      success: true,
      message: result.message
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

export const getUserDailyLogsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    // Validate user ID
    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    // Validate pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      throw new AppError(400, 'Invalid pagination parameters');
    }

    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new AppError(400, 'Both startDate and endDate must be provided for date filtering');
    }

    const result = await getUserDailyLogs(
      targetUserId,
      pageNum,
      limitNum,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: result
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

export const getDailyLogStatsController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate || !userId) {
      throw new AppError(400, 'startDate, endDate, and userId are required');
    }

    const stats = await getDailyLogStats(
      new Date(startDate as string),
      new Date(endDate as string),
      Number(userId)
    );

    res.status(200).json({
      success: true,
      data: stats
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