const { Call, CallParticipant, User } = require('../database/models');
const { v4: uuidv4 } = require('uuid');

class CallingService {
  async initiateCall(initiatorId, data) {
    if (data.participant_ids && data.participant_ids.length > 0) {
      const validUsersCount = await User.count({ where: { id: data.participant_ids } });
      if (validUsersCount !== data.participant_ids.length) {
        throw { statusCode: 400, message: 'One or more participant IDs are invalid or do not exist' };
      }
    }

    const call = await Call.create({
      call_type: data.call_type || 'audio',
      initiated_by: initiatorId,
      status: 'ringing',
      room_id: uuidv4(),
    });

    await CallParticipant.create({
      call_id: call.id,
      user_id: initiatorId,
      status: 'joined',
      joined_at: new Date(),
    });

    if (data.participant_ids && data.participant_ids.length > 0) {
      const participants = data.participant_ids.map((uid) => ({
        call_id: call.id,
        user_id: uid,
        status: 'ringing',
      }));
      await CallParticipant.bulkCreate(participants);
    }

    return this.getCallById(call.id);
  }

  async joinCall(callId, userId) {
    const call = await Call.findByPk(callId);
    if (!call) throw { statusCode: 404, message: 'Call not found' };
    if (call.status === 'ended') throw { statusCode: 400, message: 'Call has already ended' };

    let participant = await CallParticipant.findOne({
      where: { call_id: callId, user_id: userId },
    });

    if (participant) {
      await participant.update({ status: 'joined', joined_at: new Date() });
    } else {
      participant = await CallParticipant.create({
        call_id: callId,
        user_id: userId,
        status: 'joined',
        joined_at: new Date(),
      });
    }

    if (call.status === 'ringing') {
      await call.update({ status: 'ongoing', started_at: new Date() });
    }

    return this.getCallById(callId);
  }

  async leaveCall(callId, userId) {
    const participant = await CallParticipant.findOne({
      where: { call_id: callId, user_id: userId },
    });
    if (!participant) throw { statusCode: 404, message: 'Not a participant' };

    await participant.update({ status: 'left', left_at: new Date() });

    const activeParticipants = await CallParticipant.count({
      where: { call_id: callId, status: 'joined' },
    });

    if (activeParticipants === 0) {
      await this.endCall(callId, userId);
    }

    return this.getCallById(callId);
  }

  async endCall(callId, userId) {
    const call = await Call.findByPk(callId);
    if (!call) throw { statusCode: 404, message: 'Call not found' };

    const endedAt = new Date();
    const durationSeconds = call.started_at ? Math.floor((endedAt - call.started_at) / 1000) : 0;

    await call.update({ status: 'ended', ended_at: endedAt, duration_seconds: durationSeconds });
    await CallParticipant.update(
      { status: 'left', left_at: endedAt },
      { where: { call_id: callId, status: 'joined' } }
    );

    return this.getCallById(callId);
  }

  async getCallById(id) {
    return Call.findByPk(id, {
      include: [
        { model: User, as: 'initiator', attributes: ['id', 'email'] },
        { model: CallParticipant, as: 'participants', include: [{ model: User, as: 'callUser', attributes: ['id', 'email'] }] },
      ],
    });
  }

  async getCallHistory(userId, query) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Call.findAndCountAll({
      include: [
        { model: CallParticipant, as: 'participants', where: { user_id: userId }, attributes: [] },
        { model: User, as: 'initiator', attributes: ['id', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return { calls: rows, total: count, page: parseInt(page), limit: parseInt(limit) };
  }
}

module.exports = new CallingService();
