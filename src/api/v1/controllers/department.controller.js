const departmentService = require('../../../services/department.service');
const { success, error } = require('../../../utils/response');

// ✅ CREATE
const create = async (req, res) => {
  try {
    const result = await departmentService.create(req.body);
    return success(res, result, 'Department created', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL
const getAll = async (req, res) => {
  try {
    const result = await departmentService.getAll();
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET BY ID
const getById = async (req, res) => {
  try {
    const result = await departmentService.getById(req.params.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ UPDATE
const update = async (req, res) => {
  try {
    const result = await departmentService.update(req.params.id, req.body);
    return success(res, result, 'Department updated');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ DELETE
const remove = async (req, res) => {
  try {
    const result = await departmentService.delete(req.params.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { create, getAll, getById, update, remove };