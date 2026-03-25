const models = require('../database/models');
const { Op } = require('sequelize');

const Meeting = models.Meeting;
const MeetingParticipant = models.MeetingParticipant;
const User = models.User;
const sequelize = models.sequelize;

const notificationService = require('./notification.service');

/**
 * ✅ CREATE MEETING
 */
const create = async (data, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const { participants = [], ...meetingData } = data;

    const meeting = await Meeting.create(
      {
        ...meetingData,
        organizer_id: userId
      },
      { transaction }
    );

    const uniqueParticipants = [...new Set([...participants, userId])];

    if (uniqueParticipants.length > 0) {
      const participantData = uniqueParticipants.map(id => ({
        meeting_id: meeting.id,
        user_id: id,
        status: id === userId ? 'accepted' : 'invited',
        is_required: true
      }));

      await MeetingParticipant.bulkCreate(participantData, { transaction });

      // 🔔 Send notifications (except organizer)
      await Promise.all(
        uniqueParticipants
          .filter(id => id !== userId)
          .map(participantId =>
            notificationService.create({
              user_id: participantId,
              title: 'Meeting Invitation',
              message: `You have been invited to meeting: ${meeting.title}`
            })
          )
      );
    }

    await transaction.commit();
    return meeting;

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * ✅ GET ALL MEETINGS
 */
const getAll = async (query, userId) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Meeting.findAndCountAll({
    include: [
      {
        model: MeetingParticipant,
        as: 'participants',
        required: false // 🔥 Keep this false for Op.or
      }
    ],
    where: {
      [Op.or]: [
        { organizer_id: userId },
        { '$participants.user_id$': userId }
      ]
    },
    limit,
    offset,
    distinct: true,
    subQuery: false, // 🔥 CRITICAL for filtering on associations with limit/offset
    order: [['start_time', 'DESC']]
  });

  return {
    meetings: rows,
    total: count,
    page,
    limit
  };
};

/**
 * ✅ GET MEETING BY ID
 */
const getById = async (id, userId) => {
  const meeting = await Meeting.findOne({
    where: { id },
    include: [
      {
        model: MeetingParticipant,
        as: 'participants',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email']
          }
        ]
      }
    ]
  });

  if (!meeting) throw new Error('Meeting not found');

  const isParticipant = meeting.participants.some(
    p => p.user_id === userId
  );

  if (meeting.organizer_id !== userId && !isParticipant) {
    throw new Error('Unauthorized');
  }

  return meeting;
};

/**
 * ✅ UPDATE MEETING
 */
const update = async (id, data, userId) => {
  const meeting = await Meeting.findByPk(id);

  if (!meeting) throw new Error('Meeting not found');

  if (meeting.organizer_id !== userId) {
    throw new Error('Unauthorized');
  }

  await meeting.update(data);
  return meeting;
};

/**
 * ✅ DELETE MEETING
 */
const remove = async (id, userId) => {
  const meeting = await Meeting.findByPk(id);

  if (!meeting) throw new Error('Meeting not found');

  if (meeting.organizer_id !== userId) {
    throw new Error('Unauthorized');
  }

  await meeting.destroy();
  return true;
};

/**
 * ✅ ADD PARTICIPANTS
 */
const addParticipants = async (meetingId, participants, userId) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error('Invalid participants');
  }

  const meeting = await Meeting.findByPk(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  if (meeting.organizer_id !== userId) {
    throw new Error('Unauthorized');
  }

  const uniqueParticipants = [...new Set(participants)];

  const existing = await MeetingParticipant.findAll({
    where: { meeting_id: meetingId }
  });

  const existingUserIds = existing.map(p => p.user_id);

  const newParticipants = uniqueParticipants
    .filter(id => !existingUserIds.includes(id))
    .map(id => ({
      meeting_id: meetingId,
      user_id: id,
      status: 'invited',
      is_required: true
    }));

  if (!newParticipants.length) {
    throw new Error('Participants already exist');
  }

  await MeetingParticipant.bulkCreate(newParticipants);

  // 🔔 Notifications
  await Promise.all(
    newParticipants.map(user =>
      notificationService.create({
        user_id: user.user_id,
        title: 'Meeting Invitation',
        message: `You have been added to meeting: ${meeting.title}`
      })
    )
  );

  return true;
};

/**
 * ✅ GET PARTICIPANTS
 */
const getParticipants = async (meetingId) => {
  return await MeetingParticipant.findAll({
    where: { meeting_id: meetingId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email']
      }
    ]
  });
};

/**
 * ✅ REMOVE PARTICIPANT
 */
const removeParticipant = async (meetingId, userId, currentUserId) => {
  const meeting = await Meeting.findByPk(meetingId);

  if (!meeting) throw new Error('Meeting not found');

  if (meeting.organizer_id !== currentUserId) {
    throw new Error('Unauthorized');
  }

  await MeetingParticipant.destroy({
    where: {
      meeting_id: meetingId,
      user_id: userId
    }
  });

  return true;
};

/**
 * ✅ UPDATE PARTICIPANT STATUS
 */
const updateParticipantStatus = async (meetingId, userId, status) => {
  const participant = await MeetingParticipant.findOne({
    where: {
      meeting_id: meetingId,
      user_id: userId
    }
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  await participant.update({ status });

  // 🔔 Notify organizer
  const meeting = await Meeting.findByPk(meetingId);

  if (meeting) {
    await notificationService.create({
      user_id: meeting.organizer_id,
      title: 'Participant Response',
      message: `User ${userId} has ${status} the meeting: ${meeting.title}`
    });
  }

  return participant;
};

/**
 * ✅ EXPORTS
 */
module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: remove,
  addParticipants,
  getParticipants,
  removeParticipant,
  updateParticipantStatus
};