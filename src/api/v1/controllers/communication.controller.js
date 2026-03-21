const models = require('../../../database/models');

// ✅ FIXED MODEL MAPPING
const Message = models.Message;   // 🔥 FIXED (was chat_messages ❌)
const ChatRoom = models.ChatRoom;
const ChatRoomMember = models.ChatRoomMember;
const Conversation = models.Conversation;
const ConversationMember = models.ConversationMember;
const User = models.User;
const sequelize = models.sequelize;

const { success, error, paginated } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/validators');
const { Op } = require('sequelize');

// ✅ SAFETY CHECK (prevents silent crashes)
if (!Message) {
  throw new Error("❌ Message model is undefined. Check models/index.js");
}

/**
 * ✅ GET USER CONVERSATIONS
 */
const getConversations = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Conversation.findAndCountAll({
      include: [
        {
          model: ConversationMember,
          as: 'members',
          where: { user_id: req.user.id },
          attributes: [],
        },
        {
          model: ConversationMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email']
            }
          ]
        }
      ],
      distinct: true,
      order: [['last_message_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) {
    console.error('Get Conversations Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ GET MESSAGES
 */
const getMessages = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { conversation_id, chat_room_id } = req.query;

    if (!conversation_id && !chat_room_id) {
      return error(res, 'conversation_id or chat_room_id required', 400);
    }

    if (conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: { conversation_id, user_id: req.user.id }
      });
      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    if (chat_room_id) {
      const isMember = await ChatRoomMember.findOne({
        where: { chat_room_id, user_id: req.user.id }
      });
      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    const where = {};
    if (conversation_id) where.conversation_id = conversation_id;
    if (chat_room_id) where.chat_room_id = chat_room_id;

    const { count, rows } = await Message.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) {
    console.error('Get Messages Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ SEND MESSAGE
 */
const sendMessage = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const senderId = req.user.id;
    const { receiver_id, message, conversation_id, chat_room_id } = req.body;

    if (!message) return error(res, 'Message is required', 400);

    let conversation = null;

    // 💬 DIRECT MESSAGE
    if (receiver_id) {
      if (receiver_id === senderId) {
        return error(res, 'Cannot message yourself', 400);
      }

      const conversations = await Conversation.findAll({
        include: [{
          model: ConversationMember,
          as: 'members',
          where: {
            user_id: { [Op.in]: [senderId, receiver_id] }
          },
          attributes: ['user_id']
        }]
      });

      conversation = conversations.find(conv => {
        const ids = conv.members.map(m => m.user_id);
        return ids.length === 2 && ids.includes(senderId) && ids.includes(receiver_id);
      });

      if (!conversation) {
        conversation = await Conversation.create({}, { transaction });

        await ConversationMember.bulkCreate([
          { conversation_id: conversation.id, user_id: senderId, role: 'admin' },
          { conversation_id: conversation.id, user_id: receiver_id, role: 'member' }
        ], { transaction });
      }
    }

    // 🏢 GROUP
    if (conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: { conversation_id, user_id: senderId }
      });

      if (!isMember) return error(res, 'Unauthorized', 403);
      conversation = { id: conversation_id };
    }

    // 💬 CHAT ROOM
    if (chat_room_id) {
      const isMember = await ChatRoomMember.findOne({
        where: { chat_room_id, user_id: senderId }
      });

      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    if (!conversation && !chat_room_id) {
      return error(res, 'Invalid message target', 400);
    }

    const newMessage = await Message.create({
      sender_id: senderId,
      message,
      conversation_id: conversation ? conversation.id : null,
      chat_room_id: chat_room_id || null
    }, { transaction });

    if (conversation) {
      await Conversation.update(
        { last_message_at: new Date() },
        { where: { id: conversation.id }, transaction }
      );
    }

    await transaction.commit();

    return success(res, newMessage, 'Message sent', 201);

  } catch (err) {
    await transaction.rollback();
    console.error('Send Message Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ MARK AS READ
 */
const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;

    const message = await Message.findByPk(messageId);

    if (!message) return error(res, 'Message not found', 404);

    if (message.conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: {
          conversation_id: message.conversation_id,
          user_id: req.user.id
        }
      });
      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    if (message.chat_room_id) {
      const isMember = await ChatRoomMember.findOne({
        where: {
          chat_room_id: message.chat_room_id,
          user_id: req.user.id
        }
      });
      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    await message.update({
      is_read: true,
      read_at: new Date()
    });

    return success(res, message, 'Message marked as read');

  } catch (err) {
    console.error('MarkAsRead Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ GET CHAT ROOMS
 */
const getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.findAll({
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          where: { user_id: req.user.id },
          attributes: []
        },
        {
          model: ChatRoomMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email']
            }
          ]
        }
      ],
      distinct: true
    });

    return success(res, rooms);
  } catch (err) {
    console.error('Get ChatRooms Error:', err);
    return error(res, err.message, 500);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getChatRooms,
  markAsRead
};