const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');
const chatSocket = require('./chat.socket');
const meetingSocket = require('./meeting.socket');
const notificationSocket = require('./notification.socket');
const callSocket = require('./call.socket');
const screenshareSocket = require('./screenshare.socket');

const onlineUsers = new Map();

const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT.secret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected via socket: ${userId}`);

    onlineUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);

    io.emit('user_status_change', { userId, status: 'online' });

    chatSocket(io, socket, onlineUsers);
    meetingSocket(io, socket);
    notificationSocket(io, socket);
    callSocket(io, socket);
    screenshareSocket(io, socket);

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit('user_status_change', { userId, status: 'offline' });
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
