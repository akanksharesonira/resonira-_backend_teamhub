const designationService = require('../../../services/designation.service');
const { success, error } = require('../../../utils/response');

// ✅ CREATE
const create = async (req, res) => {
  try {
    const result = await designationService.create(req.body);
    return success(res, result, 'Designation created', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL
const getAll = async (req, res) => {
  try {
    const result = await designationService.getAll();
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET BY ID
const getById = async (req, res) => {
  try {
    const result = await designationService.getById(req.params.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ UPDATE
const update = async (req, res) => {
  try {
    const result = await designationService.update(req.params.id, req.body);
    return success(res, result, 'Designation updated');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ DELETE
const remove = async (req, res) => {
  try {
    const result = await designationService.delete(req.params.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { create, getAll, getById, update, remove };