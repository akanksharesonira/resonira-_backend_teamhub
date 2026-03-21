const { Leave, Employee, LeaveType } = require('../database/models');
const { Op } = require('sequelize');

class LeaveService {

  // ✅ APPLY LEAVE
  async applyLeave(userId, data) {
    const employee = await Employee.findOne({
      where: { user_id: userId }
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    let { leave_type_id, start_date, end_date, reason } = data;

    if (!start_date || !end_date) {
      throw { statusCode: 400, message: 'start_date and end_date are required' };
    }

    if (new Date(start_date) > new Date(end_date)) {
      throw { statusCode: 400, message: 'Invalid date range' };
    }

    // 🔥 AUTO CREATE LEAVE TYPE
    let leaveType = null;

    if (leave_type_id) {
      leaveType = await LeaveType.findByPk(leave_type_id);
    }

    if (!leaveType) {
      leaveType = await LeaveType.create({
        name: 'Auto Leave',
        description: 'Created automatically',
        max_days_per_year: 10,
        is_paid: true,
        is_active: true
      });

      leave_type_id = leaveType.id;
    }

    // 🚫 Prevent overlapping leaves
    const overlapping = await Leave.findOne({
      where: {
        employee_id: employee.id,
        [Op.or]: [
          {
            start_date: { [Op.between]: [start_date, end_date] }
          },
          {
            end_date: { [Op.between]: [start_date, end_date] }
          }
        ]
      }
    });

    if (overlapping) {
      throw { statusCode: 400, message: 'Leave already exists for selected dates' };
    }

    const leave = await Leave.create({
      employee_id: employee.id,
      leave_type_id,
      start_date,
      end_date,
      reason,
      status: 'pending'
    });

    return leave;
  }

  // ✅ GET MY LEAVES
  async getMyLeaves(userId, query) {
    const employee = await Employee.findOne({
      where: { user_id: userId }
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Leave.findAndCountAll({
      where: { employee_id: employee.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return { data: rows, total: count, page, limit };
  }

  // ✅ GET ALL LEAVES (FIXED INSIDE CLASS)
  async getAllLeaves(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    if (query.status) where.status = query.status;
    if (query.employee_id) where.employee_id = query.employee_id;

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'employee_code']
        },
        {
          model: LeaveType,
          as: 'leaveType'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      data: rows,
      total: count,
      page,
      limit
    };
  }

  // ✅ UPDATE STATUS
  async updateStatus(id, status) {
    const leave = await Leave.findByPk(id);

    if (!leave) {
      throw { statusCode: 404, message: 'Leave not found' };
    }

    if (leave.status !== 'pending') {
      throw { statusCode: 400, message: 'Leave already processed' };
    }

    await leave.update({ status });

    return leave;
  }

  // ✅ GET LEAVE TYPES
  async getLeaveTypes() {
    return await LeaveType.findAll({
      where: { is_active: true }
    });
  }
}

module.exports = new LeaveService();