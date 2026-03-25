const { User, Employee, Department, Designation, Organization, Role, Permission, Holiday, LeaveType } = require('../../../database/models');
const { success, error, paginated } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/validators');
const { hashPassword } = require('../../../utils/encryption');

const getUsers = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name', 'phone', 'date_of_joining', 'status', 'employee_code'],
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name'] },
          { model: Designation, as: 'designation', attributes: ['id', 'name'] },
        ],
      }],
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    await user.update({ role: req.body.role });
    return success(res, user, 'Role updated');
  } catch (err) {
    return error(res, err.message);
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    // Accept explicit is_active from body, or toggle
    const newStatus = req.body.is_active !== undefined ? req.body.is_active : !user.is_active;
    await user.update({ is_active: newStatus });
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });
    return success(res, updatedUser, `User ${updatedUser.is_active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return error(res, err.message);
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: Designation, as: 'designations' }],
      order: [['name', 'ASC']],
    });
    return success(res, departments);
  } catch (err) {
    return error(res, err.message);
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    return success(res, dept, 'Department created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ include: [{ model: Permission, as: 'permissions' }] });
    return success(res, roles);
  } catch (err) {
    return error(res, err.message);
  }
};

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({ where: { is_active: true }, order: [['date', 'ASC']] });
    return success(res, holidays);
  } catch (err) {
    return error(res, err.message);
  }
};

const createHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    return success(res, holiday, 'Holiday created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getUsers, updateUserRole, toggleUserStatus, getDepartments, createDepartment, getRoles, getHolidays, createHoliday };
