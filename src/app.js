const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const { defaultLimiter } = require('./middleware/rateLimit.middleware');
const auditLogger = require('./middleware/audit.middleware');
const errorHandler = require('./middleware/error.middleware');
const apiRoutes = require('./api/v1/routes');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

const app = express();

// Security and middleware
app.use(helmet());
// Dynamic CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Always include these defaults
['http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_URL]
  .filter(Boolean)
  .forEach(o => { if (!allowedOrigins.includes(o)) allowedOrigins.push(o); });

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    // In development, allow ALL origins
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    // In production, strictly validate
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(auditLogger);

// Rate Limiting
app.use('/api', defaultLimiter);

// Make uploads folder static
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1', apiRoutes);

// --- Diagnostic Routes ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, status: 'UP', timestamp: new Date() });
});

app.get('/api/v1/test-sql', async (req, res) => {
  try {
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    const [tables] = await sequelize.query('SHOW TABLES');
    const [[userCount]] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [[taskConstraints]] = await sequelize.query("SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'tasks' AND REFERENCED_TABLE_NAME IS NOT NULL");
    
    res.status(200).json({
      success: true,
      database: 'Connected',
      tablesFound: tables.length,
      activeUsers: userCount.count,
      taskConstraints: taskConstraints.count,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Base route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Team Hub API is running. Access endpoints via /api/v1' });
});


// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Team Hub backend is fully operational.' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
