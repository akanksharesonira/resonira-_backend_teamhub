const employeeService = require('../../../services/employee.service');
const { success, error, paginated } = require('../../../utils/response');

// ✅ CREATE EMPLOYEE (NEW)
const create = async (req, res) => {
  try {
    const employee = await employeeService.create(req.body);

    return success(res, employee, 'Employee created successfully', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL
const getAll = async (req, res) => {
  try {
    const result = await employeeService.getAll(req.query);
    return paginated(res, result.employees, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET BY ID
const getById = async (req, res) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    return success(res, employee);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const employee = await employeeService.getByUserId(req.user.id);
    return success(res, employee);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ UPDATE
const update = async (req, res) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body);
    return success(res, employee, 'Employee updated');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ STATS
const getStats = async (req, res) => {
  try {
    const stats = await employeeService.getStats();
    return success(res, stats);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// 🔥 IMPORTANT: EXPORT ALL FUNCTIONS
module.exports = {
  create, // ✅ THIS FIXES YOUR ERROR
  getAll,
  getById,
  getMyProfile,
  update,
  getStats
};