const leaveService = require('../../../services/leave.service');
const { success, error, paginated } = require('../../../utils/response');

// ✅ APPLY LEAVE
const apply = async (req, res) => {
  try {
    const result = await leaveService.applyLeave(req.user.id, req.body);
    return success(res, result, 'Leave applied successfully', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET MY LEAVES
const getMyLeaves = async (req, res) => {
  try {
    const result = await leaveService.getMyLeaves(req.user.id, req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL LEAVES
const getAll = async (req, res) => {
  try {
    const result = await leaveService.getAllLeaves(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ APPROVE LEAVE
const approve = async (req, res) => {
  try {
    const result = await leaveService.updateStatus(req.params.id, 'approved');
    return success(res, result, 'Leave approved');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ REJECT LEAVE
const reject = async (req, res) => {
  try {
    const result = await leaveService.updateStatus(req.params.id, 'rejected');
    return success(res, result, 'Leave rejected');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET LEAVE TYPES
const getLeaveTypes = async (req, res) => {
  try {
    const result = await leaveService.getLeaveTypes();
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  apply,
  getMyLeaves,
  getAll,
  approve,
  reject,
  getLeaveTypes
};