const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING(100), allowNull: false },
  module: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.STRING(500) },
  old_values: { type: DataTypes.JSON },
  new_values: { type: DataTypes.JSON },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AuditLog;
