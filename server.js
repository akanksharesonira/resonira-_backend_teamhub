// Resonira Team Hub Backend - Server Entry Point
const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const sequelize = require('./src/config/database');
const logger = require('./src/utils/logger');
const { initializeSocket } = require('./src/socket');
const { Server } = require('socket.io');

const server = http.createServer(app);

// 🔌 Socket.IO setup — dynamic CORS mirroring app.js
const socketAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);
['http://localhost:3000', 'http://localhost:5173', env.FRONTEND_URL]
  .filter(Boolean)
  .forEach(o => { if (!socketAllowedOrigins.includes(o)) socketAllowedOrigins.push(o); });

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV === 'development') return callback(null, true);
      if (socketAllowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
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
    server.listen(env.PORT, '0.0.0.0', () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      let wifiIp = 'localhost';
      for (const devName in networkInterfaces) {
        const iface = networkInterfaces[devName];
        for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            wifiIp = alias.address;
          }
        }
      }
      
      logger.info(` Server running on port ${env.PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(` Local Access:          http://localhost:${env.PORT}`);
      logger.info(` Network Access (WiFi): http://${wifiIp}:${env.PORT}`);
      logger.info(` Health:                http://localhost:${env.PORT}/health`);
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
