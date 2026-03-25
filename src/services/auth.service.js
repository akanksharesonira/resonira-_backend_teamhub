const { User, Employee, RefreshToken } = require('../database/models');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/encryption');
const { Op } = require('sequelize');

class AuthService {
  async register(data) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw { statusCode: 409, message: 'Email already registered' };

    const password_hash = await hashPassword(data.password);
    
    // Wrap in transaction for bidirectional consistency
    const result = await User.sequelize.transaction(async (t) => {
      const user = await User.create({
        email: data.email,
        password_hash,
        role: data.role || 'employee',
      }, { transaction: t });

      const employee = await Employee.create({
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        employee_code: `EMP${String(user.id).padStart(5, '0')}`,
      }, { transaction: t });

      // Bidirectional link
      await user.update({ employee_id: employee.id }, { transaction: t });

      return { user, employee };
    });

    const { user, employee } = result;
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      employeeId: employee.id 
    });
    const refreshToken = generateRefreshToken({ id: user.id });

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { 
      user: { 
        id: user.id,
        name: `${employee.first_name} ${employee.last_name || ''}`.trim(),
        email: user.email, 
        role: user.role,
        employeeId: employee.id 
      }, 
      token, 
      refreshToken 
    };
  }

  async login(email, password) {
    // Correctly JOIN users and employees tables as requested
    const user = await User.findOne({ 
      where: { email },
      include: [{ 
        model: Employee, 
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name', 'profile_picture']
      }]
    });

    if (!user) throw { statusCode: 401, message: 'Invalid credentials' };
    if (!user.is_active) throw { statusCode: 403, message: 'Account is deactivated' };

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) throw { statusCode: 401, message: 'Invalid credentials' };

    await user.update({ last_login: new Date() });

    const empId = user.employee ? user.employee.id : null;
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      employeeId: empId 
    });
    const refreshToken = generateRefreshToken({ id: user.id });

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        name: user.employee ? `${user.employee.first_name} ${user.employee.last_name || ''}`.trim() : 'Guest',
        email: user.email,
        role: user.role,
        employeeId: empId,
        department: user.employee?.department?.name || null,
        employee: user.employee || null,
      },
      token,
      refreshToken,
    };
  }

  async refreshToken(token) {
    const stored = await RefreshToken.findOne({
      where: { token, is_revoked: false, expires_at: { [Op.gt]: new Date() } },
    });
    if (!stored) throw { statusCode: 401, message: 'Invalid refresh token' };

    const decoded = verifyRefreshToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) throw { statusCode: 401, message: 'User not found or inactive' };

    await stored.update({ is_revoked: true });

    const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { token: newToken, refreshToken: newRefreshToken };
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Employee, as: 'employee', include: ['department', 'designation'] }],
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const userData = user.toJSON();
    return {
      id: userData.id,
      name: userData.employee ? `${userData.employee.first_name} ${userData.employee.last_name || ''}`.trim() : 'Guest',
      email: userData.email,
      role: userData.role,
      employeeId: userData.employee ? userData.employee.id : null,
      department: userData.employee?.department?.name || null,
      employee: userData.employee || null,
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const isValid = await comparePassword(oldPassword, user.password_hash);
    if (!isValid) throw { statusCode: 400, message: 'Current password is incorrect' };

    const password_hash = await hashPassword(newPassword);
    await user.update({ password_hash });

    await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId } });

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
