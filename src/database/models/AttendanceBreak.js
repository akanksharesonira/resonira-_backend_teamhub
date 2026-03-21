const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AttendanceBreak = sequelize.define('AttendanceBreak', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  attendance_id: { type: DataTypes.INTEGER, allowNull: false },
  break_start: { type: DataTypes.DATE, allowNull: false },
  break_end: { type: DataTypes.DATE },
  break_type: {
    type: DataTypes.ENUM('lunch', 'tea', 'personal', 'other'),
    defaultValue: 'lunch',
  },
  duration_minutes: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'attendance_breaks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AttendanceBreak;
