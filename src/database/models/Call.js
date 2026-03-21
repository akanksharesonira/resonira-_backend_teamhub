const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Call = sequelize.define('Call', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  call_type: {
    type: DataTypes.ENUM('audio', 'video'),
    defaultValue: 'audio',
  },
  initiated_by: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('ringing', 'ongoing', 'ended', 'missed', 'rejected'),
    defaultValue: 'ringing',
  },
  started_at: { type: DataTypes.DATE },
  ended_at: { type: DataTypes.DATE },
  duration_seconds: { type: DataTypes.INTEGER },
  recording_url: { type: DataTypes.STRING(500) },
  room_id: { type: DataTypes.STRING(100) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'calls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Call;
