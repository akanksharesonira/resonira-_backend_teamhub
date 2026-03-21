const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Holiday = sequelize.define('Holiday', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  type: {
    type: DataTypes.ENUM('national', 'regional', 'company', 'optional'),
    defaultValue: 'company',
  },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  organization_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'holidays',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Holiday;
