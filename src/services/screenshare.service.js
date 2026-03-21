const { ScreenShareSession, User, Call } = require('../database/models');

class ScreenShareService {
  async startSession(data) {
    const session = await ScreenShareSession.create({
      call_id: data.call_id,
      meeting_id: data.meeting_id,
      shared_by: data.shared_by,
      status: 'active',
      started_at: new Date(),
    });
    return this.getById(session.id);
  }

  async stopSession(sessionId, userId) {
    const session = await ScreenShareSession.findByPk(sessionId);
    if (!session) throw { statusCode: 404, message: 'Session not found' };
    if (session.shared_by !== userId) throw { statusCode: 403, message: 'Not the session owner' };

    await session.update({ status: 'ended', ended_at: new Date() });
    return session;
  }

  async getById(id) {
    return ScreenShareSession.findByPk(id, {
      include: [
        { model: User, as: 'sharer', attributes: ['id', 'email'] },
        { model: Call, as: 'call' },
      ],
    });
  }

  async getActiveByCallId(callId) {
    return ScreenShareSession.findAll({
      where: { call_id: callId, status: 'active' },
      include: [{ model: User, as: 'sharer', attributes: ['id', 'email'] }],
    });
  }
}

module.exports = new ScreenShareService();
