const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'User ID is required' },
      isInt: { msg: 'User ID must be an integer' }
    }
  },

  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title cannot be empty' }
    }
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  type: {
    type: DataTypes.ENUM(
      'info',
      'success',
      'warning',
      'error',
      'task',
      'leave',
      'meeting',
      'call',
      'chat'
    ),
    defaultValue: 'info',
  },

  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
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
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] }
  ],

  hooks: {
    beforeUpdate: (notification) => {
      notification.updated_at = new Date();
    }
  }
});

/**
 * ✅ ASSOCIATIONS (VERY IMPORTANT)
 */
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE'
  });
};

module.exports = Notification;