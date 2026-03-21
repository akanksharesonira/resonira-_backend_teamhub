const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  check_in: { type: DataTypes.DATE },
  check_out: { type: DataTypes.DATE },
  check_in_location: { type: DataTypes.STRING(255) },
  check_out_location: { type: DataTypes.STRING(255) },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'wfh', 'on_leave'),
    defaultValue: 'present',
  },
  total_hours: { type: DataTypes.DECIMAL(5, 2) },
  overtime_hours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Attendance;
