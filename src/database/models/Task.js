const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  project_id: { type: DataTypes.INTEGER },
  assignedTo: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    field: 'assignedTo' 
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    field: 'createdBy'
  },


  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'in_review', 'done', 'cancelled'),
    defaultValue: 'todo',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  due_date: { type: DataTypes.DATEONLY },
  start_date: { type: DataTypes.DATEONLY },
  completed_at: { type: DataTypes.DATE },
  estimated_hours: { type: DataTypes.DECIMAL(6, 2) },
  actual_hours: { type: DataTypes.DECIMAL(6, 2) },
  tags: { type: DataTypes.JSON },
  attachments: { type: DataTypes.JSON },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Task;
