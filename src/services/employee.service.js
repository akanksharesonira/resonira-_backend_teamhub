const { Employee, User, Department, Designation } = require('../database/models');
const { Op } = require('sequelize');
const { parsePagination, parseSort } = require('../utils/validators');
const bcrypt = require('bcrypt');

class EmployeeService {

  // 🔥 CREATE EMPLOYEE (FINAL FIX)
  async create(data) {
    // ✅ validation
    if (!data.first_name || !data.email) {
      throw { statusCode: 400, message: 'First name and email are required' };
    }

    // ✅ check duplicate email in USER table
    const existingUser = await User.findOne({
      where: { email: data.email }
    });

    if (existingUser) {
      throw { statusCode: 400, message: 'Email already exists' };
    }

    // ✅ create USER first
    const hashedPassword = await bcrypt.hash(data.password || 'Password@123', 10);

    const user = await User.create({
      email: data.email,
      password_hash: hashedPassword,
      role: data.role || 'employee',
      is_active: true
    });

    // ✅ create EMPLOYEE with user_id
    const employee = await Employee.create({
      first_name: data.first_name,
      last_name: data.last_name,
      department_id: data.department_id,
      designation_id: data.designation_id,
      status: data.status || 'active',
      user_id: user.id // 🔥 REQUIRED
    });

    return employee;
  }

  // ✅ GET ALL
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const order = parseSort(query, ['created_at', 'first_name', 'last_name', 'employee_code']);
    const where = {};

    if (query.status) where.status = query.status;
    if (query.department_id) where.department_id = query.department_id;

    if (query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${query.search}%` } },
        { last_name: { [Op.like]: `%${query.search}%` } },
        { employee_code: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'role', 'is_active'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
      ],
      order,
      limit,
      offset,
    });

    return { employees: rows, total: count, page, limit };
  }

  // ✅ GET BY ID
  async getById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password_hash'] } },
        { model: Department, as: 'department' },
        { model: Designation, as: 'designation' },
      ],
    });

    if (!employee) throw { statusCode: 404, message: 'Employee not found' };

    return employee;
  }

  // ✅ GET BY USER ID
  async getByUserId(userId) {
    const employee = await Employee.findOne({
      where: { user_id: userId },
      include: ['department', 'designation'],
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee profile not found' };
    }

    return employee;
  }

  // ✅ UPDATE
  async update(id, data) {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    await employee.update(data);
    return employee;
  }

  // ✅ STATS
  async getStats() {
    const total = await Employee.count();
    const active = await Employee.count({ where: { status: 'active' } });
    const onLeave = await Employee.count({ where: { status: 'on_leave' } });
    const departments = await Department.count();

    return { total, active, onLeave, departments };
  }
}

module.exports = new EmployeeService();