const meetingService = require('../../../services/meeting.service');
const { success, error, paginated } = require('../../../utils/response');
const Joi = require('joi');

const meetingCreationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  date: Joi.string().optional(), // format: DD-MM-YYYY or YYYY-MM-DD
  time: Joi.string().optional(), // format: HH:mm
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  duration: Joi.number().integer().min(1).optional(), // in minutes
  participants: Joi.array().items(Joi.number().integer()).optional(),
  type: Joi.string().valid('team', 'one_on_one', 'client', 'interview').optional(),
  meeting_link: Joi.string().uri().allow('', null).optional(),
  agenda: Joi.string().allow('', null).optional(),
  project_id: Joi.number().integer().allow(null).optional(),
}).unknown(true);

/**
 * ✅ CREATE MEETING
 */
const create = async (req, res) => {
  try {
    const { error: validationError } = meetingCreationSchema.validate(req.body, { abortEarly: false });
    if (validationError) {
      const messages = validationError.details.map(d => d.message).join('; ');
      return error(res, `Validation failed: ${messages}`, 400);
    }

    let { date, time, start_time, end_time, duration, ...rest } = req.body;

    // 1. Calculate start_time from date + time if provided
    if (!start_time && date && time) {
      // Assuming frontend sends DD-MM-YYYY or YYYY-MM-DD
      const [p1, p2, p3] = date.includes('-') ? date.split('-') : [];
      let isoDateStr = '';
      if (p1 && p1.length === 4) { // YYYY-MM-DD
        isoDateStr = `${date}T${time}:00`;
      } else if (p3 && p3.length === 4) { // DD-MM-YYYY
        isoDateStr = `${p3}-${p2}-${p1}T${time}:00`; 
      }
      
      const parsedStart = new Date(isoDateStr);
      if (!isNaN(parsedStart.valueOf())) {
        start_time = parsedStart;
      }
    } else if (start_time) {
      start_time = new Date(start_time);
    }

    if (!start_time || isNaN(new Date(start_time).valueOf())) {
      return error(res, 'Valid start_time (or date + time) is required.', 400);
    }

    // 2. Calculate end_time
    if (!end_time) {
      const durationMins = duration || 60; // default 1 hour
      end_time = new Date(start_time.getTime() + durationMins * 60000);
    } else {
      end_time = new Date(end_time);
    }

    if (!end_time || isNaN(new Date(end_time).valueOf())) {
      return error(res, 'Valid end_time could not be calculated.', 400);
    }
    
    // Ensure start_time is before end_time
    if (start_time >= end_time) {
      return error(res, 'end_time must be strictly after start_time', 400);
    }

    const meetingPayload = {
      ...rest,
      start_time,
      end_time
    };

    const meeting = await meetingService.create(meetingPayload, req.user.id);
    return success(res, meeting, 'Meeting created', 201);
  } catch (err) {
    console.error('Create Meeting Error:', err);
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
      return error(res, `Database constraint error: ${err.message}`, 400);
    }
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