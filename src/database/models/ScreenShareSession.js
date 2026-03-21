const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ScreenShareSession = sequelize.define('ScreenShareSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  call_id: { type: DataTypes.INTEGER },
  meeting_id: { type: DataTypes.INTEGER },
  shared_by: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'ended'),
    defaultValue: 'active',
  },
  started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ended_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'screen_share_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ScreenShareSession;
