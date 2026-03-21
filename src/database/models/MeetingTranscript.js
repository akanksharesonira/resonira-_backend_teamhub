const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MeetingTranscript = sequelize.define('MeetingTranscript', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  meeting_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT('long') },
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
  generated_by: { type: DataTypes.ENUM('manual', 'ai'), defaultValue: 'manual' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'meeting_transcripts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MeetingTranscript;
