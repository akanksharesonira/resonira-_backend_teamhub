const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Meeting = sequelize.define('Meeting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  organizer_id: { type: DataTypes.INTEGER, allowNull: false },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING(255) },
  meeting_link: { type: DataTypes.STRING(500) },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
  },
  meeting_type: {
    type: DataTypes.ENUM('team', 'one_on_one', 'all_hands', 'client', 'interview'),
    defaultValue: 'team',
  },
  agenda: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
  recording_url: { type: DataTypes.STRING(500) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'meetings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Meeting;
