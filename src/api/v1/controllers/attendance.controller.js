const attendanceService = require('../../../services/attendance.service');
const { success, error, paginated } = require('../../../utils/response');

// ✅ CHECK-IN
const checkIn = async (req, res) => {
  try {
    const result = await attendanceService.checkIn(req.user.id, req.body);
    return success(res, result, 'Checked in successfully', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ CHECK-OUT
const checkOut = async (req, res) => {
  try {
    const result = await attendanceService.checkOut(req.user.id, req.body);
    return success(res, result, 'Checked out successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET CURRENT (today's record for logged-in user)
const getCurrent = async (req, res) => {
  try {
    const result = await attendanceService.getCurrent(req.user.id);
    return success(res, result, result ? 'Current attendance found' : 'No attendance record for today');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ATTENDANCE (Role-aware: Admin sees all, Employee sees own)
const getAttendance = async (req, res) => {
  try {
    const result = await attendanceService.getAttendance(req.user, req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET MY ATTENDANCE (Specific to logged-in user)
const getMyAttendance = async (req, res) => {
  try {
    const result = await attendanceService.getMyAttendance(req.user.id, req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL ATTENDANCE (admin/hr/manager)
const getAllAttendance = async (req, res) => {
  try {
    const result = await attendanceService.getAllAttendance(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ START BREAK
const startBreak = async (req, res) => {
  try {
    const result = await attendanceService.startBreak(req.user.id, req.body);
    return success(res, result, 'Break started', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ END BREAK
const endBreak = async (req, res) => {
  try {
    const result = await attendanceService.endBreak(req.params.breakId);
    return success(res, result, 'Break ended');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getCurrent,
  getAttendance,
  getMyAttendance,
  getAllAttendance,
  startBreak,
  endBreak,
};