const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MeetingParticipant = sequelize.define('MeetingParticipant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  meeting_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('invited', 'accepted', 'declined', 'tentative', 'attended'),
    defaultValue: 'invited',
  },
  is_required: { type: DataTypes.BOOLEAN, defaultValue: true },
  joined_at: { type: DataTypes.DATE },
  left_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'meeting_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MeetingParticipant;
