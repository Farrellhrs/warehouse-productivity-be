import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';
import { httpLogger, requestLogger, errorLogger } from './middlewares/logging.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import overviewRoutes from './modules/overview/overview.routes';
import userRoutes from './modules/user/user.routes';
import dailyLogRoutes from './modules/dailyLog/dailyLog.routes';
import activityLogRoutes from './modules/activityLog/activityLog.routes';
import performanceMetricsRoutes from './modules/performanceMetrics/performanceMetrics.routes';
// import targetRoutes from './modules/target/target.routes';
// import reportRoutes from './modules/report/report.routes';
// import settingRoutes from './modules/setting/setting.routes';

const app = express();

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Swagger UI
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5050', 'http://127.0.0.1:5050'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(httpLogger);
app.use(requestLogger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Warehouse Productivity API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    syntaxHighlight: {
      activate: true,
      theme: "monokai"
    },
    requestInterceptor: (req: any) => {
      // Ensure proper headers for Swagger UI requests
      req.headers['Accept'] = 'application/json';
      return req;
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/performance', performanceMetricsRoutes);
// app.use('/api/targets', targetRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/settings', settingRoutes);

// Error handling
app.use(errorLogger);
app.use(errorHandler);

export default app; 