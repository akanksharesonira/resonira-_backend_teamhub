const Joi = require('joi');

const updateEmployeeSchema = Joi.object({
  first_name: Joi.string().min(2).max(100),
  last_name: Joi.string().min(2).max(100),
  phone: Joi.string(),
  date_of_birth: Joi.date(),
  gender: Joi.string().valid('male', 'female', 'other'),
  address: Joi.string(),
  department_id: Joi.number().integer(),
  designation_id: Joi.number().integer(),
  manager_id: Joi.number().integer(),
  employment_type: Joi.string().valid('full_time', 'part_time', 'contract', 'intern'),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated'),
  salary: Joi.number(),
}).min(1);

module.exports = { updateEmployeeSchema };
