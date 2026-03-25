const { Leave, Employee, LeaveType, User, sequelize } = require('../database/models');
const { Op } = require('sequelize');


class LeaveService {

  // ✅ GET LEAVES (ROLE-AWARE ROUTER)
  async getLeaves(user, query) {
    const adminRoles = ['super_admin', 'admin', 'administrator', 'hr', 'manager'];
    if (adminRoles.includes(user.role)) {
      return await this.getAllLeaves(query);
    }
    return await this.getMyLeaves(user.id, query);
  }

  // ✅ APPLY LEAVE
  async applyLeave(userId, data) {
    const employee = await Employee.findOne({
      where: { user_id: userId }
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    let { leave_type_id, leave_type, start_date, end_date, reason } = data;

    if (!start_date || !end_date) {
      throw { statusCode: 400, message: 'start_date and end_date are required' };
    }

    if (new Date(start_date) > new Date(end_date)) {
      throw { statusCode: 400, message: 'Invalid date range' };
    }

    // 🔥 VALIDATE LEAVE TYPE
    let leaveType = null;
    if (leave_type_id) {
      leaveType = await LeaveType.findByPk(leave_type_id);
      if (!leaveType) {
        throw { statusCode: 400, message: 'Invalid leave_type_id' };
      }
    } else if (leave_type) {
      // Case-insensitive search
      leaveType = await LeaveType.findOne({ 
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')), 
          '=', 
          leave_type.toLowerCase()
        )
      });
      
      if (!leaveType) {
        throw { statusCode: 400, message: `Invalid leave type: ${leave_type}` };
      }
      leave_type_id = leaveType.id;
    } else {
      throw { statusCode: 400, message: 'leave_type_id or leave_type is required' };
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
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        },
        { model: LeaveType, as: 'leaveType' }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    const responseData = rows.map(item => {
      const json = item.toJSON();
      return {
        ...json,
        leave_type_name: json.leaveType ? json.leaveType.name : 'Unknown',
        // Support frontend expecting "leave_type" as string
        leave_type: json.leaveType ? json.leaveType.name : 'Unknown'
      };
    });

    return { data: responseData, total: count, page, limit };
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
          attributes: ['id', 'first_name', 'last_name', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        },
        {
          model: LeaveType,
          as: 'leaveType'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    const responseData = rows.map(item => {
      const json = item.toJSON();
      return {
        ...json,
        leave_type_name: json.leaveType ? json.leaveType.name : 'Unknown',
        // Support frontend expecting "leave_type" as string
        leave_type: json.leaveType ? json.leaveType.name : 'Unknown'
      };
    });

    return {
      data: responseData,
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

  // ✅ GET LEAVE BALANCE
  async getBalance(userId) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) throw { statusCode: 404, message: 'Employee not found' };

    // Fetch all leave types to get entitlements
    const leaveTypes = await LeaveType.findAll({ where: { is_active: true } });
    const usedLeaves = await Leave.findAll({
      where: { 
        employee_id: employee.id,
        status: 'approved'
      }
    });

    const balance = leaveTypes.map(type => {
      const used = usedLeaves
        .filter(l => l.leave_type_id === type.id)
        .reduce((sum, current) => {
          const start = new Date(current.start_date);
          const end = new Date(current.end_date);
          const days = Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24)) || 1;
          return sum + days;
        }, 0);

      return {
        leave_type_id: type.id,
        leave_type: type.name,
        entitled: type.max_days_per_year,
        used,
        remaining: Math.max(0, type.max_days_per_year - used)
      };
    });

    return balance;
  }
}

module.exports = new LeaveService();