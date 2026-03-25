const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    }
  },

  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'administrator', 'hr', 'manager', 'employee'),
    defaultValue: 'employee',
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  last_login: {
    type: DataTypes.DATE,
  },

  employee_id: {
    type: DataTypes.INTEGER,
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
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

/**
 * Associations
 */
User.associate = (models) => {
  User.hasMany(models.Notification, {
    foreignKey: 'user_id',
    as: 'notifications',
    onDelete: 'CASCADE'
  });

  User.belongsTo(models.Employee, {
    foreignKey: 'employee_id',
    as: 'employee'
  });
};

module.exports = User;