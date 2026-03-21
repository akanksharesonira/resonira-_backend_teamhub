const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  file_url: { type: DataTypes.STRING(500), allowNull: false },
  file_name: { type: DataTypes.STRING(255) },
  file_type: { type: DataTypes.STRING(50) },
  file_size: { type: DataTypes.BIGINT },
  category: { type: DataTypes.STRING(100) },
  uploaded_by: { type: DataTypes.INTEGER },
  employee_id: { type: DataTypes.INTEGER },
  department_id: { type: DataTypes.INTEGER },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Document;
