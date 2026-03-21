const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Group ID is required' },
      isInt: { msg: 'Group ID must be an integer' }
    }
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'User ID is required' },
      isInt: { msg: 'User ID must be an integer' }
    }
  },

  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },

  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }

}, {
  tableName: 'group_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id'] // 🚀 prevent duplicate members
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['group_id']
    }
  ],

  hooks: {
    beforeUpdate: (groupMember) => {
      groupMember.updated_at = new Date();
    }
  }
});

module.exports = GroupMember;