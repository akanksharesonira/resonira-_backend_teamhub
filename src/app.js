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
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
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
