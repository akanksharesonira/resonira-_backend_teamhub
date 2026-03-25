const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  conversation_id: { type: DataTypes.INTEGER },
  chat_room_id: { type: DataTypes.INTEGER },
  content: { type: DataTypes.TEXT },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'system'),
    defaultValue: 'text',
  },
  file_url: { type: DataTypes.STRING(500) },
  file_name: { type: DataTypes.STRING(255) },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  reply_to_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Message;
