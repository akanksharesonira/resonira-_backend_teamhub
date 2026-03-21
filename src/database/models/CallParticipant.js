const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const CallParticipant = sequelize.define('CallParticipant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  call_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('ringing', 'joined', 'left', 'missed', 'rejected'),
    defaultValue: 'ringing',
  },
  joined_at: { type: DataTypes.DATE },
  left_at: { type: DataTypes.DATE },
  is_muted: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_video_on: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'call_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CallParticipant;
