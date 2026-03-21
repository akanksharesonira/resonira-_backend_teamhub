const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MeetingActionItem = sequelize.define('MeetingActionItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  meeting_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  assigned_to: { type: DataTypes.INTEGER },
  due_date: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'meeting_action_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MeetingActionItem;
