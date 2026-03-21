const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false, // 🔥 STRICT in production
    stripUnknown: true   // remove extra fields
  });

  if (error) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  req.body = value;
  next();
};

module.exports = validate;