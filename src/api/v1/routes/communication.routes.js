const express = require('express');
const router = express.Router();

const authenticate = require('../../../middleware/auth.middleware');

const {
  getConversations,
  getMessages,
  sendMessage,
  getChatRooms,
  markAsRead
} = require('../controllers/communication.controller');

/**
 * 🔐 Apply authentication middleware
 */
router.use(authenticate);

/**
 * 💬 Conversations
 */
router.get('/conversations', getConversations);

/**
 * 📩 Messages
 */
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

/**
 * ✅ Mark message as read
 */
router.patch('/messages/:id/read', markAsRead);

/**
 * 🏢 Chat Rooms
 */
router.get('/chat-rooms', getChatRooms);

module.exports = router;