const Joi = require('joi');

/**
 * 🔹 Common reusable fields
 */
const participantsSchema = Joi.array()
  .items(Joi.number().integer().positive())
  .min(1)
  .unique()
  .messages({
    'array.base': 'Participants must be an array',
    'array.min': 'At least one participant is required',
    'array.unique': 'Duplicate participants are not allowed',
    'number.base': 'Participant ID must be a number'
  });

/**
 * ✅ CREATE MEETING SCHEMA
 */
const createMeetingSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .trim()
    .required(),

  description: Joi.string()
    .allow('', null)
    .optional(),

  start_time: Joi.date()
    .iso()
    .required(),

  end_time: Joi.date()
    .iso()
    .greater(Joi.ref('start_time'))
    .required(),

  location: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),

  meeting_link: Joi.string()
    .uri()
    .allow('', null)
    .optional(),

  meeting_type: Joi.string()
    .valid('team', 'one_on_one', 'all_hands', 'client', 'interview')
    .default('team'),

  agenda: Joi.string()
    .allow('', null)
    .optional(),

  participants: participantsSchema.required()
})
  .custom((value, helpers) => {
    const { start_time, end_time, meeting_link, location } = value;

    // ⏱ Minimum duration = 5 minutes
    const diff = new Date(end_time) - new Date(start_time);
    if (diff < 5 * 60 * 1000) {
      return helpers.message('Meeting must be at least 5 minutes long');
    }

    // 📍 Require either location OR meeting link
    if (!location && !meeting_link) {
      return helpers.message('Either location or meeting_link is required');
    }

    return value;
  })
  .messages({
    'string.empty': '{{#label}} cannot be empty',
    'any.required': '{{#label}} is required',
    'date.greater': 'End time must be after start time'
  });

/**
 * ✅ UPDATE MEETING SCHEMA (Flexible)
 */
const updateMeetingSchema = Joi.object({
  title: Joi.string().min(3).max(255).trim(),
  description: Joi.string().allow('', null),
  start_time: Joi.date().iso(),
  end_time: Joi.date().iso(),
  location: Joi.string().max(255).allow('', null),
  meeting_link: Joi.string().uri().allow('', null),
  meeting_type: Joi.string().valid(
    'team',
    'one_on_one',
    'all_hands',
    'client',
    'interview'
  ),
  agenda: Joi.string().allow('', null),

  // 🔥 Optional in update
  participants: participantsSchema.optional()
})
  .custom((value, helpers) => {
    const { start_time, end_time } = value;

    if (start_time && end_time) {
      const diff = new Date(end_time) - new Date(start_time);

      if (diff < 5 * 60 * 1000) {
        return helpers.message('Meeting must be at least 5 minutes long');
      }

      if (new Date(end_time) <= new Date(start_time)) {
        return helpers.message('End time must be after start time');
      }
    }

    return value;
  });

module.exports = {
  createMeetingSchema,
  updateMeetingSchema
};