const logger = require('../utils/logger');

module.exports = (io, socket) => {
  socket.on('join_meeting', (meetingId) => {
    socket.join(`meeting_${meetingId}`);
    socket.to(`meeting_${meetingId}`).emit('participant_joined', {
      userId: socket.user.id,
      meetingId,
    });
    logger.debug(`User ${socket.user.id} joined meeting ${meetingId}`);
  });

  socket.on('leave_meeting', (meetingId) => {
    socket.leave(`meeting_${meetingId}`);
    socket.to(`meeting_${meetingId}`).emit('participant_left', {
      userId: socket.user.id,
      meetingId,
    });
  });

  socket.on('meeting_message', (data) => {
    socket.to(`meeting_${data.meetingId}`).emit('new_meeting_message', {
      ...data,
      senderId: socket.user.id,
      timestamp: new Date(),
    });
  });
};
