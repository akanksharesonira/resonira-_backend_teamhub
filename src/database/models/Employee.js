const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  employee_code: { type: DataTypes.STRING(50), unique: true },
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  date_of_birth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.ENUM('male', 'female', 'other') },
  address: { type: DataTypes.TEXT },
  profile_picture: { type: DataTypes.STRING(500) },
  department_id: { type: DataTypes.INTEGER },
  designation_id: { type: DataTypes.INTEGER },
  manager_id: { type: DataTypes.INTEGER },
  organization_id: { type: DataTypes.INTEGER },
  date_of_joining: { type: DataTypes.DATEONLY },
  employment_type: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern'),
    defaultValue: 'full_time',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'),
    defaultValue: 'active',
  },
  salary: { type: DataTypes.DECIMAL(12, 2) },
  bank_account: { type: DataTypes.STRING(50) },
  pan_number: { type: DataTypes.STRING(20) },
  aadhar_number: { type: DataTypes.STRING(20) },
  emergency_contact_name: { type: DataTypes.STRING(100) },
  emergency_contact_phone: { type: DataTypes.STRING(20) },
  initial_password: { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

/**
 * Associations
 */
Employee.associate = (models) => {
  Employee.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  Employee.hasOne(models.User, {
    foreignKey: 'employee_id',
    as: 'userAccount'
  });
  Employee.belongsTo(models.Department, {
    foreignKey: 'department_id',
    as: 'department'
  });
  Employee.belongsTo(models.Designation, {
    foreignKey: 'designation_id',
    as: 'designation'
  });
};

module.exports = Employee;
