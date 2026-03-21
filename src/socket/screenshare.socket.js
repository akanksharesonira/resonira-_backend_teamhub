const logger = require('../utils/logger');

module.exports = (io, socket) => {
  socket.on('start_screenshare', (data) => {
    socket.to(`call_${data.roomId}`).emit('screenshare_started', {
      userId: socket.user.id,
      sessionId: data.sessionId,
    });
    logger.debug(`User ${socket.user.id} started screen share in room ${data.roomId}`);
  });

  socket.on('stop_screenshare', (data) => {
    socket.to(`call_${data.roomId}`).emit('screenshare_stopped', {
      userId: socket.user.id,
      sessionId: data.sessionId,
    });
    logger.debug(`User ${socket.user.id} stopped screen share in room ${data.roomId}`);
  });

  socket.on('screenshare_offer', (data) => {
    socket.to(data.targetSocketId).emit('screenshare_offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderUserId: socket.user.id,
    });
  });

  socket.on('screenshare_answer', (data) => {
    socket.to(data.targetSocketId).emit('screenshare_answer', {
      answer: data.answer,
      senderSocketId: socket.id,
    });
  });

  socket.on('screenshare_ice_candidate', (data) => {
    socket.to(data.targetSocketId).emit('screenshare_ice_candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id,
    });
  });
};
