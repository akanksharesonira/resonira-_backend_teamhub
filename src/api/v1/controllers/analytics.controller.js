const analyticsService = require('../../../services/analytics.service');
const { success, error } = require('../../../utils/response');

const getDashboard = async (req, res) => {
  try {
    const data = await analyticsService.getDashboard();
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const data = await analyticsService.getAttendanceReport(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

const getLeaveReport = async (req, res) => {
  try {
    const data = await analyticsService.getLeaveReport(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

const getTaskReport = async (req, res) => {
  try {
    const data = await analyticsService.getTaskReport(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getDashboard, getAttendanceReport, getLeaveReport, getTaskReport };
