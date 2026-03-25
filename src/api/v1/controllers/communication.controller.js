const models = require('../../../database/models');

const Message = models.Message;
const ChatRoom = models.ChatRoom;
const ChatRoomMember = models.ChatRoomMember;
const Conversation = models.Conversation;
const ConversationMember = models.ConversationMember;
const User = models.User;
const Employee = models.Employee;
const sequelize = models.sequelize;

const { success, error, paginated } = require('../../../utils/response');
const logger = require('../../../utils/logger');
const storageService = require('../../../services/storage.service');
const { parsePagination } = require('../../../utils/validators');
const { Op } = require('sequelize');
const fs = require('fs');

// ✅ SAFETY CHECK
if (!Message) {
  throw new Error("❌ Message model is undefined. Check models/index.js");
}

/**
 * ✅ RESOLVE CONVERSATION (Get or Create)
 * Ensures a conversation exists between two users.
 */
const resolveConversation = async (req, res, next) => {
  try {
    const senderId = Number(req.user.id);
    const partnerId = Number(req.query.partner_id);

    if (!partnerId) {
      return error(res, 'partner_id is required', 400);
    }

    if (senderId === partnerId) {
      return error(res, 'Cannot create a conversation with yourself', 400);
    }

    // Standard Direct Message Lookup
    const conversations = await Conversation.findAll({
      where: { type: 'direct' },
      include: [{
        model: ConversationMember,
        as: 'members',
        where: { user_id: { [Op.in]: [senderId, partnerId] } }
      }],
    });

    // Find the exact conversation that has BOTH members (and only 2 members)
    let conversation = null;
    for (const c of conversations) {
      const memberCount = await ConversationMember.count({ where: { conversation_id: c.id } });
      if (memberCount === 2) {
        conversation = c;
        break;
      }
    }

    if (!conversation) {
      logger.info(`Creating new direct conversation between ${senderId} and ${partnerId}`);
      conversation = await sequelize.transaction(async (t) => {
        const newConv = await Conversation.create({ type: 'direct' }, { transaction: t });
        await ConversationMember.bulkCreate([
          { conversation_id: newConv.id, user_id: senderId, role: 'admin' },
          { conversation_id: newConv.id, user_id: partnerId, role: 'member' }
        ], { transaction: t });
        return newConv;
      });
    }

    return success(res, conversation, 'Conversation resolved');
  } catch (err) {
    logger.error('Resolve Conversation Error', { error: err.message, userId: req.user?.id });
    next(err);
  }
};

/**
 * ✅ GET USER CONVERSATIONS
 */
const getConversations = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    // Step 1: Find conversation IDs where the current user is a member
    const currentUserId = Number(req.user.id);
    const myMemberships = await ConversationMember.findAll({
      where: { user_id: currentUserId },
      attributes: ['conversation_id'],
      raw: true,
    });
    const myConvIds = myMemberships.map(m => Number(m.conversation_id));

    if (myConvIds.length === 0) {
      return paginated(res, [], 0, 1, limit);
    }

    // Step 2: Fetch those conversations with ALL their members + user info
    const { count, rows } = await Conversation.findAndCountAll({
      where: { id: { [Op.in]: myConvIds } },
      include: [
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
    logger.error('Get Conversations Error', { error: err.message, sql: err.sql || null, userId: req.user?.id });
    next(err);
  }
};

/**
 * ✅ GET MESSAGES
 */
const getMessages = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    let { conversation_id, chat_room_id, partner_id } = req.query;
    const currentUserId = Number(req.user.id);

    // ── Partner ID Fallback: Find DM conversation ─────────
    if (partner_id && !conversation_id && !chat_room_id) {
      const partnerId = Number(partner_id);
      logger.info(`Resolving conversation for partner_id: ${partnerId} (Me: ${currentUserId})`);

      const conversations = await Conversation.findAll({
        where: { type: 'direct' },
        include: [{
          model: ConversationMember,
          as: 'members'
        }],
        order: [['last_message_at', 'DESC']]
      });

      const conv = conversations.find(c => {
        const ids = (c.members || []).map(m => Number(m.user_id));
        return ids.length === 2 && ids.includes(currentUserId) && ids.includes(partnerId);
      });

      if (conv) {
        conversation_id = Number(conv.id);
        logger.info(`Resolved partner_id ${partnerId} to conversation_id ${conversation_id}`);
      } else {
        logger.warn(`No conversation found between ${currentUserId} and ${partnerId}`);
        return success(res, [], 'No conversation yet');
      }
    }

    if (!conversation_id && !chat_room_id) {
      return error(res, 'conversation_id, chat_room_id, or partner_id required', 400);
    }

    const where = {};
    if (conversation_id) where.conversation_id = Number(conversation_id);
    if (chat_room_id) where.chat_room_id = Number(chat_room_id);
    // Null-safe is_deleted filter
    where.is_deleted = { [Op.or]: [false, null] };

    // Check authorization
    if (conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: { conversation_id: Number(conversation_id), user_id: currentUserId }
      });
      if (!isMember) {
        logger.error(`Unauthorized access attempt by ${currentUserId} to conv ${conversation_id}`);
        return error(res, 'Unauthorized', 403);
      }
    }

    const { count, rows } = await Message.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'email']
          }]
        }
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset
    });

    const formattedRows = rows.map(m => {
      const msg = m.get({ plain: true });
      const senderUser = msg.sender?.user;
      
      return {
        ...msg,
        // Map back to a flat structure the frontend expects
        sender: senderUser ? {
          id: senderUser.id,
          name: `${msg.sender.first_name} ${msg.sender.last_name}`.trim(),
          email: senderUser.email
        } : null
      };
    });

    return success(res, {
      count,
      rows: formattedRows,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    logger.error('Get Messages Error', { error: err.message, sql: err.sql || null, userId: req.user?.id });
    next(err);
  }
};

/**
 * ✅ SEND MESSAGE — Production-Grade
 *
 * Validates sender_id (from JWT), receiver_id, and message content.
 * Uses a Sequelize transaction to guarantee atomicity.
 * Logs structured SQL errors and returns actionable JSON on failure.
 */
const sendMessage = async (req, res, next) => {
  let transaction;
  let uploadedFile = req.file;

  try {
    transaction = await sequelize.transaction();

    // ── Input Normalization & Validation ───────────────────
    const senderId = Number(req.user.id); // This is the User ID
    let { receiver_id, message, conversation_id, chat_room_id, message_type } = req.body;
    
    // Normalize IDs to Numbers
    receiver_id = receiver_id ? Number(receiver_id) : null;
    conversation_id = conversation_id ? Number(conversation_id) : null;
    chat_room_id = chat_room_id ? Number(chat_room_id) : null;
    message_type = message_type || 'text';

    // 🔍 Find Employee ID for the sender (DB constraint expects employee.id)
    const senderUser = await User.findByPk(senderId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!senderUser || !senderUser.employee) {
      throw { status: 404, message: 'Sender employee record not found.' };
    }
    const senderEmployeeId = senderUser.employee.id;

    let file_url = null;
    let file_name = null;

    if (uploadedFile) {
      file_url = `/uploads/${uploadedFile.filename}`;
      file_name = uploadedFile.originalname;
      if (message_type === 'text') {
        if (uploadedFile.mimetype.startsWith('image/')) message_type = 'image';
        else if (uploadedFile.mimetype.startsWith('audio/')) message_type = 'audio';
        else if (uploadedFile.mimetype.startsWith('video/')) message_type = 'video';
        else message_type = 'file';
      }
    }

    // Validation
    if (message_type === 'text' && (!message || !message.trim())) {
      throw { status: 400, message: 'Message content is required for text messages.' };
    }
    if (['image', 'file', 'audio', 'video'].includes(message_type) && !file_url) {
      throw { status: 400, message: `file_url is required for ${message_type} messages.` };
    }

    if (!receiver_id && !conversation_id && !chat_room_id) {
      throw { status: 400, message: 'receiver_id, conversation_id, or chat_room_id is required.' };
    }

    let conversation = null;

    // ── DIRECT MESSAGE ─────────────────────────────────────
    if (receiver_id) {
      if (Number(receiver_id) === senderId) {
        throw { status: 400, message: 'Cannot message yourself.' };
      }

      const receiverUser = await User.findByPk(Number(receiver_id));
      if (!receiverUser) {
        throw { status: 404, message: `Receiver with id ${receiver_id} does not exist.` };
      }

      const conversations = await Conversation.findAll({
        where: { type: 'direct' },
        include: [{
          model: ConversationMember,
          as: 'members'
        }],
        order: [['last_message_at', 'DESC']]
      });

      conversation = conversations.find(conv => {
        const members = conv.members || [];
        const ids = members.map(m => Number(m.user_id));
        return ids.length === 2 && ids.includes(senderId) && ids.includes(Number(receiver_id));
      });

      if (!conversation) {
        logger.info(`Creating new direct conversation between ${senderId} and ${receiver_id}`);
        conversation = await Conversation.create({ type: 'direct' }, { transaction });
        await ConversationMember.bulkCreate([
          { conversation_id: conversation.id, user_id: senderId, role: 'admin' },
          { conversation_id: conversation.id, user_id: Number(receiver_id), role: 'member' }
        ], { transaction });
      } else {
        conversation_id = Number(conversation.id);
      }
    }

    // ── GROUP/CONV/ROOM ────────────────────────────────────
    if (conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: { conversation_id, user_id: senderId }
      });
      if (!isMember) throw { status: 403, message: 'Unauthorized: not a member of this conversation.' };
      conversation = { id: conversation_id };
    }

    if (chat_room_id) {
      const isMember = await ChatRoomMember.findOne({
        where: { chat_room_id, user_id: senderId }
      });
      if (!isMember) throw { status: 403, message: 'Unauthorized: not a member of this chat room.' };
    }

    // ── Insert Message ─────────────────────────────────────
    const newMessage = await Message.create({
      sender_id: senderEmployeeId, // Use Employee ID for sender_id
      content: message ? message.trim() : (file_name || message_type),
      conversation_id: conversation ? conversation.id : null,
      chat_room_id: chat_room_id || null,
      message_type,
      file_url,
      file_name,
      is_read: false // Explicitly set is_read to false for new messages
    }, { transaction });

    if (conversation) {
      await Conversation.update(
        { last_message_at: new Date() },
        { where: { id: conversation.id }, transaction }
      );
    }

    await transaction.commit();

    // ── Emit Real-Time Socket Event ─────────────────────────
    const io = req.app.get('io');
    if (io) {
      const messagePayload = {
        ...newMessage.toJSON(),
        sender: { id: req.user.id, email: req.user.email } // Frontend still expects User ID
      };

      if (chat_room_id) {
        io.to(`room_${chat_room_id}`).emit('new_message', messagePayload);
      } else if (conversation) {
        io.to(`conv_${conversation.id}`).emit('new_message', messagePayload);
        // Fallback for users not in the conversation room yet
        if (receiver_id) {
          io.to(`user_${receiver_id}`).emit('new_message', messagePayload);
        }
      }
    }

    return success(res, newMessage, 'Message sent', 201);

  } catch (err) {
    if (transaction) await transaction.rollback();

    // Cleanup uploaded file on failure
    if (uploadedFile) {
      try {
        await storageService.deleteFile(uploadedFile.filename);
      } catch (cleanupErr) {
        logger.error('File cleanup failed', { error: cleanupErr.message, filename: uploadedFile.filename });
      }
    }

    if (err.status) {
      return error(res, err.message, err.status);
    }

    logger.error('Send Message Error', {
      error: err.message,
      userId: req.user?.id,
      body: req.body
    });

    next(err);
  }
};

/**
 * ✅ MARK AS READ
 */
const markAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const message = await Message.findByPk(messageId);

    if (!message) return error(res, 'Message not found', 404);

    if (message.conversation_id) {
      const isMember = await ConversationMember.findOne({
        where: {
          conversation_id: Number(message.conversation_id),
          user_id: Number(req.user.id)
        }
      });
      if (!isMember) return error(res, 'Unauthorized', 403);
    }

    if (message.chat_room_id) {
      const isMember = await ChatRoomMember.findOne({
        where: {
          chat_room_id: Number(message.chat_room_id),
          user_id: Number(req.user.id)
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
    logger.error('MarkAsRead Error', { error: err.message, userId: req.user?.id });
    next(err);
  }
};

/**
 * ✅ GET CHAT ROOMS
 */
const getChatRooms = async (req, res, next) => {
  try {
    // Step 1: Find room IDs where the current user is a member
    const currentUserId = Number(req.user.id);
    const myRoomMemberships = await ChatRoomMember.findAll({
      where: { user_id: currentUserId },
      attributes: ['chat_room_id'],
      raw: true,
    });
    const myRoomIds = myRoomMemberships.map(m => Number(m.chat_room_id));

    if (myRoomIds.length === 0) {
      return success(res, []);
    }

    // Step 2: Fetch those rooms with ALL their members + user info
    const rooms = await ChatRoom.findAll({
      where: { id: { [Op.in]: myRoomIds } },
      include: [
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
    logger.error('Get ChatRooms Error', { error: err.message, userId: req.user?.id });
    next(err);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getChatRooms,
  markAsRead,
  resolveConversation
};