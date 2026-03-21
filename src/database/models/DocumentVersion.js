const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const DocumentVersion = sequelize.define('DocumentVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  version_number: { type: DataTypes.INTEGER, allowNull: false },
  file_url: { type: DataTypes.STRING(500), allowNull: false },
  file_size: { type: DataTypes.BIGINT },
  change_notes: { type: DataTypes.TEXT },
  uploaded_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'document_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DocumentVersion;
