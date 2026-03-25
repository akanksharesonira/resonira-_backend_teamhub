const Joi = require('joi');
const { error } = require('../../../utils/response');

const validateCreateEmployee = (req, res, next) => {
  const schema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'admin', 'hr', 'manager', 'employee').default('employee'),
    department: Joi.string().optional(),
    department_id: Joi.number().optional(),
    employeeRole: Joi.string().optional(),
    designation: Joi.string().optional(),
    mobile_number: Joi.string().optional(),
    phone: Joi.string().optional(),
    joining_date: Joi.date().optional(),
    date_of_joining: Joi.date().optional(),
    status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated').default('active'),
  });

  const { error: validationError, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });

  if (validationError) {
    const errorDetails = validationError.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return error(res, 'Validation failed', 422, errorDetails);
  }

  req.body = value;
  next();
};

module.exports = { validateCreateEmployee };
