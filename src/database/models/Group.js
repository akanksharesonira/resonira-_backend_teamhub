const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  avatar: { type: DataTypes.STRING(500) },
  created_by: { type: DataTypes.INTEGER },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'team_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

/**
 * ✅ CORRECT WAY: attach associate BEFORE export
 */
Group.associate = (models) => {
  Group.hasMany(models.GroupMember, {
    foreignKey: 'group_id',
    as: 'members',
    onDelete: 'CASCADE'
  });
};

module.exports = Group;