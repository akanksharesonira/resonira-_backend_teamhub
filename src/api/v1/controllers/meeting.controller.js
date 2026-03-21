const meetingService = require('../../../services/meeting.service');
const { success, error, paginated } = require('../../../utils/response');

/**
 * ✅ CREATE MEETING
 */
const create = async (req, res) => {
  try {
    const meeting = await meetingService.create(req.body, req.user.id);
    return success(res, meeting, 'Meeting created', 201);
  } catch (err) {
    console.error('Create Meeting Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ GET ALL MEETINGS
 */
const getAll = async (req, res) => {
  try {
    const result = await meetingService.getAll(req.query, req.user.id);

    return paginated(
      res,
      result.meetings,
      result.total,
      result.page,
      result.limit
    );
  } catch (err) {
    console.error('Get Meetings Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ GET MEETING BY ID
 */
const getById = async (req, res) => {
  try {
    const meeting = await meetingService.getById(req.params.id, req.user.id);
    return success(res, meeting);
  } catch (err) {
    console.error('Get Meeting Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ UPDATE MEETING
 */
const update = async (req, res) => {
  try {
    const meeting = await meetingService.update(
      req.params.id,
      req.body,
      req.user.id
    );

    return success(res, meeting, 'Meeting updated');
  } catch (err) {
    console.error('Update Meeting Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ DELETE MEETING
 */
const remove = async (req, res) => {
  try {
    await meetingService.delete(req.params.id, req.user.id);
    return success(res, null, 'Meeting deleted');
  } catch (err) {
    console.error('Delete Meeting Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ ADD PARTICIPANTS
 */
const addParticipants = async (req, res) => {
  try {
    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return error(res, 'Participants must be a non-empty array', 400);
    }

    const result = await meetingService.addParticipants(
      req.params.id,
      participants,
      req.user.id
    );

    return success(res, result, 'Participants added');

  } catch (err) {
    console.error('Add Participants Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ GET PARTICIPANTS
 */
const getParticipants = async (req, res) => {
  try {
    const participants = await meetingService.getParticipants(req.params.id);
    return success(res, participants);
  } catch (err) {
    console.error('Get Participants Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ REMOVE PARTICIPANT
 */
const removeParticipant = async (req, res) => {
  try {
    await meetingService.removeParticipant(
      req.params.id,
      req.params.userId,
      req.user.id
    );

    return success(res, null, 'Participant removed');
  } catch (err) {
    console.error('Remove Participant Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ UPDATE PARTICIPANT STATUS
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // 🔥 validation
    if (!status) {
      return error(res, 'Status is required', 400);
    }

    const allowedStatuses = ['invited', 'accepted', 'declined'];

    if (!allowedStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const result = await meetingService.updateParticipantStatus(
      req.params.id,   // meetingId
      req.user.id,     // current user
      status
    );

    return success(res, result, 'Status updated');

  } catch (err) {
    console.error('Update Status Error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * ✅ EXPORT ALL
 */
module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  addParticipants,
  getParticipants,
  removeParticipant,
  updateStatus
};