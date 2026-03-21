const logger = require('../utils/logger');

module.exports = (io, socket) => {
  socket.on('join_call_room', (roomId) => {
    socket.join(`call_${roomId}`);
    socket.to(`call_${roomId}`).emit('user_joined_call', {
      userId: socket.user.id,
      socketId: socket.id,
    });
    logger.debug(`User ${socket.user.id} joined call room ${roomId}`);
  });

  socket.on('webrtc_offer', (data) => {
    socket.to(data.targetSocketId).emit('webrtc_offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderUserId: socket.user.id,
    });
  });

  socket.on('webrtc_answer', (data) => {
    socket.to(data.targetSocketId).emit('webrtc_answer', {
      answer: data.answer,
      senderSocketId: socket.id,
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    socket.to(data.targetSocketId).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id,
    });
  });

  socket.on('toggle_audio', (data) => {
    socket.to(`call_${data.roomId}`).emit('participant_toggled_audio', {
      userId: socket.user.id,
      isMuted: data.isMuted,
    });
  });

  socket.on('toggle_video', (data) => {
    socket.to(`call_${data.roomId}`).emit('participant_toggled_video', {
      userId: socket.user.id,
      isVideoOn: data.isVideoOn,
    });
  });

  socket.on('leave_call_room', (roomId) => {
    socket.leave(`call_${roomId}`);
    socket.to(`call_${roomId}`).emit('user_left_call', {
      userId: socket.user.id,
      socketId: socket.id,
    });
  });
};
