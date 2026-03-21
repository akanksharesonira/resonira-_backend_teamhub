const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT.secret, { expiresIn: env.JWT.expiresIn });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT.refreshSecret, { expiresIn: env.JWT.refreshExpiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT.secret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.refreshSecret);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
