const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ConversationMember = sequelize.define('ConversationMember', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_read_at: { type: DataTypes.DATE },
  is_muted: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'conversation_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ConversationMember;
