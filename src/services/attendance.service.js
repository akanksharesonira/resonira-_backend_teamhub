const { Attendance, AttendanceBreak, Employee, User, Department, Holiday, sequelize } = require('../database/models');
const { Op } = require('sequelize');

class AttendanceService {

  // ✅ CHECK-IN (with full validations + specific messages)
  async checkIn(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) {
      throw { statusCode: 404, message: 'Employee profile not found.' };
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const today = now.toLocaleDateString('en-CA'); // Locally formatted YYYY-MM-DD

    // 1. Sunday check
    if (now.getDay() === 0) {
      throw { statusCode: 400, message: 'Cannot check in on Sunday' };
    }

    // 2. Holiday check
    const holiday = await Holiday.findOne({
      where: { date: today, is_active: true },
    });
    if (holiday) {
      throw { statusCode: 400, message: `Cannot check in on a holiday (${holiday.name})` };
    }

    // 3. Time window: 10:00 AM – 6:00 PM (Server Time)
    if (hours < 10) {
      throw { statusCode: 400, message: 'Check-in not allowed before 10:00 AM' };
    }
    if (hours >= 18) {
      throw { statusCode: 400, message: 'Check-in closed after 6:00 PM' };
    }

    // 4. Duplicate check (employee_id, date)
    const existing = await Attendance.findOne({
      where: { employee_id: employee.id, date: today },
    });
    if (existing) {
      throw { statusCode: 400, message: 'Already checked in today' };
    }

    // 5. Late detection: after 10:15 AM
    const isLate = hours > 10 || (hours === 10 && minutes > 15);
    const status = isLate ? 'late' : 'present';

    // 6. Create record in transaction
    const attendance = await sequelize.transaction(async (t) => {
      return Attendance.create({
        employee_id: employee.id,
        date: today,
        check_in: now,
        status,
        check_in_location: data.location || null,
      }, { transaction: t });
    });

    return attendance;
  }

  // ✅ CHECK-OUT (calculate duration in seconds)
  async checkOut(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) {
      throw { statusCode: 404, message: 'Employee profile not found' };
    }

    const today = new Date().toLocaleDateString('en-CA');

    const attendance = await Attendance.findOne({
      where: { employee_id: employee.id, date: today, check_out: null },
    });

    if (!attendance || !attendance.check_in) {
      throw { statusCode: 400, message: 'Please check in first' };
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.check_in);
    
    // Duration in SECONDS as requested
    const durationSeconds = Math.floor((checkOutTime - checkInTime) / 1000);
    const totalHours = (durationSeconds / 3600).toFixed(2);

    // Determine if half_day (less than 4 hours)
    let updatedStatus = attendance.status;
    if (parseFloat(totalHours) < 4) {
      updatedStatus = 'half_day';
    }

    await sequelize.transaction(async (t) => {
      await attendance.update({
        check_out: checkOutTime,
        check_out_location: data.location || null,
        duration: durationSeconds,
        total_hours: parseFloat(totalHours),
        status: updatedStatus,
      }, { transaction: t });
    });

    return attendance;
  }

  // ✅ GET CURRENT (with nested user/employee metadata)
  async getCurrent(userId) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) return null;

    const record = await Attendance.findOne({
      where: { 
        employee_id: employee.id, 
        check_out: null 
      },
      include: [
        { model: AttendanceBreak, as: 'breaks' },
        {
          model: Employee,
          as: 'employee',
          include: [
            { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
            { model: Department, as: 'department', attributes: ['name'] },
          ],
        },
      ],
      order: [['check_in', 'DESC']],
    });

    if (!record) return null;

    const plain = record.get({ plain: true });
    const emp = plain.employee || {};
    const usr = emp.user || {};

    return {
      ...plain,
      user: {
        id: usr.id,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        email: usr.email,
        role: usr.role
      },
      employee: {
        id: emp.id,
        department: emp.department
      }
    };
  }

  // ✅ GET ATTENDANCE (Role-Aware Wrapper)
  async getAttendance(user, query) {
    const adminRoles = ['super_admin', 'admin', 'administrator', 'hr', 'manager'];
    
    if (adminRoles.includes(user.role)) {
      return await this.getAllAttendance(query);
    } else {
      return await this.getMyAttendance(user.id, query);
    }
  }

  // ✅ GET MY ATTENDANCE
  async getMyAttendance(userId, query) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) throw { statusCode: 404, message: 'Employee not found' };

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Attendance.findAndCountAll({
      where: { employee_id: employee.id },
      include: [
        { model: AttendanceBreak, as: 'breaks' },
        { 
          model: Employee, 
          as: 'employee', 
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }] 
        }
      ],
      order: [['date', 'DESC'], ['check_in', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  // ✅ GET ALL ATTENDANCE (Nested for Identity Resolution)
  async getAllAttendance(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.date) where.date = query.date;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [
            { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
            { model: Department, as: 'department', attributes: ['name'] },
          ],
        },
      ],
      order: [['check_in', 'DESC']],
      limit,
      offset,
    });

    const formattedData = rows.map(record => {
      const plain = record.get({ plain: true });
      const emp = plain.employee || {};
      const usr = emp.user || {};

      return {
        ...plain,
        user: {
          id: usr.id,
          name: emp.first_name ? `${emp.first_name} ${emp.last_name}`.trim() : 'Staff Member',
          email: usr.email,
          role: usr.role
        },
        employee: {
          id: emp.id,
          department: emp.department
        }
      };
    });

    return { data: formattedData, total: count, page, limit };
  }

  // ✅ START BREAK
  async startBreak(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });
    const today = new Date().toLocaleDateString('en-CA');
    const attendance = await Attendance.findOne({
      where: { employee_id: employee.id, date: today, check_out: null }
    });

    if (!attendance) throw { statusCode: 400, message: 'No active attendance found. Please check in first.' };

    return await AttendanceBreak.create({
      attendance_id: attendance.id,
      break_start: new Date(),
      break_type: data.break_type || 'lunch',
    });
  }

  // ✅ END BREAK
  async endBreak(breakId) {
    const breakRecord = await AttendanceBreak.findByPk(breakId);
    if (!breakRecord || breakRecord.break_end) throw { statusCode: 400, message: 'Invalid break record' };

    const breakEnd = new Date();
    const duration = Math.floor((breakEnd - new Date(breakRecord.break_start)) / (1000 * 60));

    await breakRecord.update({ break_end: breakEnd, duration_minutes: duration });
    return breakRecord;
  }
}

module.exports = new AttendanceService();