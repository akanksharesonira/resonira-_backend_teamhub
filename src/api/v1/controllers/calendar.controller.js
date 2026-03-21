const { Calendar } = require('../../../database/models');
const { success, error } = require('../../../utils/response');
const { Op } = require('sequelize');

/**
 * Allowed fields for create/update
 */
const ALLOWED_FIELDS = [
  'title',
  'description',
  'start_date',
  'end_date',
  'location',
  'is_all_day'
];

/**
 * Utility: Pick only allowed fields
 */
const pickFields = (body) => {
  return Object.keys(body)
    .filter((key) => ALLOWED_FIELDS.includes(key))
    .reduce((obj, key) => {
      obj[key] = body[key];
      return obj;
    }, {});
};

/**
 * ✅ CREATE EVENT
 */
const create = async (req, res) => {
  try {
    const data = pickFields(req.body);

    if (!data.title || !data.start_date) {
      return error(res, 'Title and start_date are required', 400);
    }

    const event = await Calendar.create({
      ...data,
      user_id: req.user.id
    });

    return success(res, event, 'Event created', 201);
  } catch (err) {
    console.error('Create Event Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * ✅ GET MY EVENTS (with filters + pagination)
 */
const getMyEvents = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 10 } = req.query;

    const where = { user_id: req.user.id };

    if (from && to) {
      where.start_date = {
        [Op.between]: [new Date(from), new Date(to)]
      };
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Calendar.findAndCountAll({
      where,
      order: [['start_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success(res, {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Get Events Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * ✅ GET EVENT BY ID
 */
const getById = async (req, res) => {
  try {
    const event = await Calendar.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!event) {
      return error(res, 'Event not found', 404);
    }

    return success(res, event);
  } catch (err) {
    console.error('Get Event By ID Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * ✅ UPDATE EVENT
 */
const update = async (req, res) => {
  try {
    const event = await Calendar.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!event) {
      return error(res, 'Event not found', 404);
    }

    const data = pickFields(req.body);

    await event.update(data);

    return success(res, event, 'Event updated');
  } catch (err) {
    console.error('Update Event Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * ✅ DELETE EVENT
 */
const remove = async (req, res) => {
  try {
    const event = await Calendar.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!event) {
      return error(res, 'Event not found', 404);
    }

    await event.destroy();

    return success(res, null, 'Event deleted');
  } catch (err) {
    console.error('Delete Event Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

module.exports = {
  create,
  getMyEvents,
  getById,
  update,
  remove
};