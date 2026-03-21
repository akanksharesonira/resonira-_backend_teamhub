const { Attendance, AttendanceBreak, Employee } = require('../database/models');

class AttendanceService {

  // ✅ CHECK-IN
  async checkIn(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    const today = new Date().toISOString().split('T')[0];

    const existing = await Attendance.findOne({
      where: { employee_id: employee.id, date: today }
    });

    if (existing) {
      throw { statusCode: 400, message: 'Already checked in today' };
    }

    const attendance = await Attendance.create({
      employee_id: employee.id,
      date: today,
      check_in: new Date(),
      status: 'present',
      check_in_location: data.location || null,
    });

    return attendance;
  }

  // ✅ CHECK-OUT
  async checkOut(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      where: { employee_id: employee.id, date: today }
    });

    if (!attendance) {
      throw { statusCode: 400, message: 'No check-in found for today' };
    }

    if (attendance.check_out) {
      throw { statusCode: 400, message: 'Already checked out' };
    }

    const checkOutTime = new Date();

    const totalHours = (
      (checkOutTime - attendance.check_in) / (1000 * 60 * 60)
    ).toFixed(2);

    await attendance.update({
      check_out: checkOutTime,
      check_out_location: data.location || null,
      total_hours: totalHours,
    });

    return attendance;
  }

  // ✅ GET MY ATTENDANCE
  async getMyAttendance(userId, query) {
    const employee = await Employee.findOne({ where: { user_id: userId } });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Attendance.findAndCountAll({
      where: { employee_id: employee.id },
      include: [{ model: AttendanceBreak, as: 'breaks' }],
      order: [['date', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  // ✅ START BREAK
  async startBreak(userId, data) {
    const employee = await Employee.findOne({ where: { user_id: userId } });

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      where: { employee_id: employee.id, date: today }
    });

    if (!attendance) {
      throw { statusCode: 400, message: 'No active attendance' };
    }

    const breakRecord = await AttendanceBreak.create({
      attendance_id: attendance.id,
      break_start: new Date(),
      break_type: data.break_type || 'lunch',
    });

    return breakRecord;
  }

  // ✅ END BREAK
  async endBreak(breakId) {
    const breakRecord = await AttendanceBreak.findByPk(breakId);

    if (!breakRecord) {
      throw { statusCode: 404, message: 'Break not found' };
    }

    const breakEnd = new Date();

    const duration = Math.floor(
      (breakEnd - breakRecord.break_start) / (1000 * 60)
    );

    await breakRecord.update({
      break_end: breakEnd,
      duration_minutes: duration,
    });

    return breakRecord;
  }
}

module.exports = new AttendanceService();