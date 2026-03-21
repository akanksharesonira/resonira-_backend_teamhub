const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    defaultValue: 'direct',
  },
  name: { type: DataTypes.STRING(255) },
  created_by: { type: DataTypes.INTEGER },
  last_message_at: { type: DataTypes.DATE },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Conversation;
