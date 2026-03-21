const logger = require('../utils/logger');

module.exports = (io, socket) => {
  socket.on('subscribe_notifications', () => {
    socket.join(`notifications_${socket.user.id}`);
    logger.debug(`User ${socket.user.id} subscribed to notifications`);
  });

  socket.on('unsubscribe_notifications', () => {
    socket.leave(`notifications_${socket.user.id}`);
  });
};
