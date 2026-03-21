const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Calendar = sequelize.define('Calendar', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  event_type: {
    type: DataTypes.ENUM('meeting', 'task', 'holiday', 'birthday', 'reminder', 'other'),
    defaultValue: 'other',
  },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE },
  all_day: { type: DataTypes.BOOLEAN, defaultValue: false },
  location: { type: DataTypes.STRING(255) },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  recurrence_rule: { type: DataTypes.STRING(255) },
  color: { type: DataTypes.STRING(20) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'calendar_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Calendar;
