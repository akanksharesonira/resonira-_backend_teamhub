const authService = require('../../../services/auth.service');
const { success, error } = require('../../../utils/response');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return success(res, result, 'Registration successful', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return success(res, result, 'Login successful');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, user);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { register, login, refreshToken, getProfile, changePassword };
