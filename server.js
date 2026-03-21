const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const sequelize = require('./src/config/database');
const logger = require('./src/utils/logger');
const { initializeSocket } = require('./src/socket');
const { Server } = require('socket.io');

const server = http.createServer(app);

// 🔌 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: env.frontendUrl || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeSocket(io);

//  Start Server
const startServer = async () => {
  try {
    //  Step 1: DB Connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    //  REMOVE THIS COMPLETELY (CAUSE OF YOUR ERROR)
    // await sequelize.sync({ alter: true });

    //  OPTIONAL (ONLY FIRST TIME SETUP - COMMENT AFTER USE)
    // await sequelize.sync(); 

    logger.info('✅ Server initialization completed.');

    //  Step 2: Start Server
    server.listen(env.PORT, () => {
      logger.info(` Server running on port ${env.PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(` Health: http://localhost:${env.PORT}/health`);
    });

  } catch (error) {
    logger.error(' Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});