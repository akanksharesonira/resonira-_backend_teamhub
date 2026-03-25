const express = require('express');
const router = express.Router();

const authenticate = require('../../../middleware/auth.middleware');
const upload = require('../../../middleware/upload.middleware');

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
router.get('/conversation/resolve', require('../controllers/communication.controller').resolveConversation);

/**
 * 📩 Messages
 */
router.get('/messages', getMessages);
router.post('/messages', upload.single('file'), sendMessage);

/**
 * ✅ Mark message as read
 */
router.patch('/messages/:id/read', markAsRead);

/**
 * 🏢 Chat Rooms
 */
router.get('/chat-rooms', getChatRooms);

module.exports = router;