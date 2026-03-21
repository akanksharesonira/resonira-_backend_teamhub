const Joi = require('joi');

const initiateCallSchema = Joi.object({
  call_type: Joi.string().valid('audio', 'video').required(),
  participant_ids: Joi.array().items(Joi.number().integer()).min(1).required(),
});

module.exports = { initiateCallSchema };
