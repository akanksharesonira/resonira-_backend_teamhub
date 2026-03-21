const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Organization = sequelize.define('Organization', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  domain: { type: DataTypes.STRING(255) },
  logo: { type: DataTypes.STRING(500) },
  address: { type: DataTypes.TEXT },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(255) },
  website: { type: DataTypes.STRING(500) },
  timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Kolkata' },
  date_format: { type: DataTypes.STRING(20), defaultValue: 'DD-MM-YYYY' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'organizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Organization;
