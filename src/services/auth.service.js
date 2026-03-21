const { User, Employee, RefreshToken } = require('../database/models');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/encryption');
const { Op } = require('sequelize');

class AuthService {
  async register(data) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw { statusCode: 409, message: 'Email already registered' };

    const password_hash = await hashPassword(data.password);
    const user = await User.create({
      email: data.email,
      password_hash,
      role: data.role || 'employee',
    });

    await Employee.create({
      user_id: user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      employee_code: `EMP${String(user.id).padStart(5, '0')}`,
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { user: { id: user.id, email: user.email, role: user.role }, token, refreshToken };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw { statusCode: 401, message: 'Invalid credentials' };
    if (!user.is_active) throw { statusCode: 403, message: 'Account is deactivated' };

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) throw { statusCode: 401, message: 'Invalid credentials' };

    await user.update({ last_login: new Date() });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const employee = await Employee.findOne({ where: { user_id: user.id } });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: employee ? { id: employee.id, first_name: employee.first_name, last_name: employee.last_name, profile_picture: employee.profile_picture } : null,
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
    return user;
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
