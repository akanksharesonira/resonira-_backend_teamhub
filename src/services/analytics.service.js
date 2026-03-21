const { Employee, Attendance, Leave, Task, Meeting, Department } = require('../database/models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class AnalyticsService {
  async getDashboard() {
    const totalEmployees = await Employee.count({ where: { status: 'active' } });
    const totalDepartments = await Department.count();
    const todayDate = new Date().toISOString().split('T')[0];

    const presentToday = await Attendance.count({
      where: { date: todayDate, status: { [Op.in]: ['present', 'late', 'wfh'] } },
    });

    const pendingLeaves = await Leave.count({ where: { status: 'pending' } });
    const activeTasks = await Task.count({ where: { status: { [Op.in]: ['todo', 'in_progress'] } } });
    const upcomingMeetings = await Meeting.count({
      where: { start_time: { [Op.gte]: new Date() }, status: 'scheduled' },
    });

    return {
      totalEmployees,
      totalDepartments,
      presentToday,
      absentToday: totalEmployees - presentToday,
      pendingLeaves,
      activeTasks,
      upcomingMeetings,
    };
  }

  async getAttendanceReport(query) {
    const { from, to, department_id } = query;
    const where = {};
    if (from && to) where.date = { [Op.between]: [from, to] };

    const includeWhere = {};
    if (department_id) includeWhere.department_id = department_id;

    const records = await Attendance.findAll({
      where,
      include: [{ model: Employee, as: 'employee', where: includeWhere, attributes: ['id', 'first_name', 'last_name', 'employee_code'] }],
      order: [['date', 'DESC']],
    });

    return records;
  }

  async getLeaveReport(query) {
    const { from, to, status } = query;
    const where = {};
    if (from && to) where.start_date = { [Op.between]: [from, to] };
    if (status) where.status = status;

    return Leave.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['created_at', 'DESC']],
    });
  }

  async getTaskReport(query) {
    const { project_id, status } = query;
    const where = {};
    if (project_id) where.project_id = project_id;
    if (status) where.status = status;

    const tasks = await Task.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    return tasks;
  }
}

module.exports = new AnalyticsService();
