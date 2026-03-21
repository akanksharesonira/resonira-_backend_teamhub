const logger = require('../utils/logger');
const { Message, Conversation, ChatRoom } = require('../database/models');

module.exports = (io, socket, onlineUsers) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    logger.debug(`User ${socket.user.id} joined conversation ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`);
  });

  socket.on('join_room', (roomId) => {
    socket.join(`room_${roomId}`);
    logger.debug(`User ${socket.user.id} joined room ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(`room_${roomId}`);
  });

  socket.on('typing', ({ conversationId, roomId, isTyping }) => {
    if (conversationId) {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        conversationId,
        isTyping,
      });
    } else if (roomId) {
      socket.to(`room_${roomId}`).emit('user_typing', {
        userId: socket.user.id,
        roomId,
        isTyping,
      });
    }
  });

  socket.on('mark_read', async ({ messageIds, conversationId, roomId }) => {
    try {
      await Message.update(
        { is_read: true },
        { where: { id: messageIds, sender_id: { $ne: socket.user.id } } }
      );
      
      const target = conversationId ? `conv_${conversationId}` : `room_${roomId}`;
      socket.to(target).emit('messages_read', { messageIds, readBy: socket.user.id });
    } catch (err) {
      logger.error('Error marking messages read:', err);
    }
  });
};
