const { Employee, User, Department, Designation, sequelize } = require('../database/models');
const { Op } = require('sequelize');
const { parsePagination, parseSort } = require('../utils/validators');
const { hashPassword } = require('../utils/encryption');

class EmployeeService {

  // ✅ CREATE EMPLOYEE + USER (with bidirectional linking and transaction)
  async create(data) {
    // Check duplicate email
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already exists' };
    }

    // Wrap in transaction
    const result = await sequelize.transaction(async (t) => {
      // 1. Hash password with helper (Uses bcryptjs)
      const password_hash = await hashPassword(data.password || 'Password@123', 12);

      // 2. Create User record
      const user = await User.create({
        email: data.email,
        password_hash,
        role: data.role || 'employee',
        is_active: true,
      }, { transaction: t });

      // 3. Resolve department ID
      let deptId = data.department_id;
      if (!deptId && data.department) {
        const [dept] = await Department.findOrCreate({
          where: { name: data.department },
          transaction: t,
        });
        deptId = dept.id;
      }

      // 4. Resolve designation ID
      let desigId = data.designation_id;
      if (!desigId && (data.designation || data.employeeRole)) {
        const desigName = data.designation || data.employeeRole;
        const [desig] = await Designation.findOrCreate({
          where: { name: desigName },
          defaults: { department_id: deptId },
          transaction: t,
        });
        desigId = desig.id;
      }

      // 5. Create Employee linked to User
      const employee = await Employee.create({
        first_name: data.first_name,
        last_name: data.last_name || '',
        phone: data.mobile_number || data.phone || null,
        date_of_joining: data.joining_date || data.date_of_joining || null,
        department_id: deptId,
        designation_id: desigId,
        status: data.status || 'active',
        user_id: user.id,
        initial_password: data.password || null,
      }, { transaction: t });

      // 6. Update USER with employee_id (Bidirectional Link)
      await user.update({ employee_id: employee.id }, { transaction: t });

      return employee;
    });

    // Return full employee with associations
    return this.getById(result.id);
  }

  // ✅ GET ALL
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const order = parseSort(query, ['created_at', 'first_name', 'last_name', 'employee_code']);
    const where = {};

    if (query.status) where.status = query.status;
    if (query.department_id) where.department_id = query.department_id;

    if (query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${query.search}%` } },
        { last_name: { [Op.like]: `%${query.search}%` } },
        { employee_code: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'role', 'is_active'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
      ],
      order,
      limit,
      offset,
    });

    return { employees: rows, total: count, page, limit };
  }

  // ✅ GET BY ID
  async getById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password_hash'] } },
        { model: Department, as: 'department' },
        { model: Designation, as: 'designation' },
      ],
    });

    if (!employee) throw { statusCode: 404, message: 'Employee not found' };

    return employee;
  }

  // ✅ GET BY USER ID
  async getByUserId(userId) {
    const employee = await Employee.findOne({
      where: { user_id: userId },
      include: ['department', 'designation'],
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee profile not found' };
    }

    return employee;
  }

  // ✅ UPDATE (DUAL-MODEL SYNC)
  async update(id, data) {
    const employee = await Employee.findByPk(id, { include: ['user'] });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found' };
    }

    // ✅ Update associated USER if credentials or role changed
    if (employee.user && (data.email || data.role || data.password)) {
      const userUpdates = {};
      if (data.email) userUpdates.email = data.email;
      if (data.role) userUpdates.role = data.role;
      if (data.password) {
        userUpdates.password_hash = await hashPassword(data.password);
      }
      
      await employee.user.update(userUpdates);
    }

    // ✅ Resolve names if provided
    if (data.department) {
      const [dept] = await Department.findOrCreate({ where: { name: data.department } });
      data.department_id = dept.id;
    }
    if (data.designation) {
      const [desig] = await Designation.findOrCreate({ where: { name: data.designation } });
      data.designation_id = desig.id;
    }

    await employee.update(data);
    return this.getById(id); // Return fresh data with inclusions
  }

  // ✅ STATS
  async getStats() {
    const total = await Employee.count();
    const active = await Employee.count({ where: { status: 'active' } });
    const onLeave = await Employee.count({ where: { status: 'on_leave' } });
    const departments = await Department.count();

    return { total, active, onLeave, departments };
  }

  // ✅ GET DEPARTMENTS (NEW)
  async getDepartments() {
    return await Department.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
  }

  // ✅ GET DESIGNATIONS (NEW)
  async getDesignations() {
    return await Designation.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
  }

  // ✅ DEEP-CLEANING PERMANENT DELETE
  async delete(id) {
    const employee = await Employee.findByPk(id, { include: ['user'] });
    if (!employee) throw { statusCode: 404, message: 'Employee not found' };

    const userId = employee.user_id ? Number(employee.user_id) : null;
    const empId = Number(id);

    return await sequelize.transaction(async (t) => {
      const db = require('../database/models');
      const { 
        Attendance, AttendanceBreak, Message, Task, TaskComment, 
        Leave, Meeting, MeetingParticipant, MeetingActionItem, Call, CallParticipant, 
        ScreenShareSession, Document, DocumentVersion, Calendar, 
        Notification, ConversationMember, ChatRoomMember, GroupMember,
        RefreshToken, Project, ProjectMember, AuditLog
      } = db;

      // 1. Attendance & Breaks
      const attendanceRecords = await Attendance.findAll({ where: { employee_id: empId }, attributes: ['id'], transaction: t });
      const attendanceIds = attendanceRecords.map(a => a.id);
      if (attendanceIds.length > 0) {
        await AttendanceBreak.destroy({ where: { attendance_id: { [Op.in]: attendanceIds } }, transaction: t });
        await Attendance.destroy({ where: { id: { [Op.in]: attendanceIds } }, transaction: t });
      }

      // 2. Work & Projects
      await TaskComment.destroy({ where: { user_id: userId }, transaction: t });
      await Task.destroy({ where: { [Op.or]: [{ assignedTo: empId }, { createdBy: empId }] }, transaction: t }); 
      
      if (Project) {
        await Project.update({ manager_id: null }, { where: { manager_id: empId }, transaction: t });
      }

      // 3. Collaboration & Meetings
      if (userId) {
        await MeetingParticipant.destroy({ where: { user_id: userId }, transaction: t });
        if (MeetingActionItem) await MeetingActionItem.destroy({ where: { assigned_to: empId }, transaction: t });
        await Meeting.destroy({ where: { organizer_id: userId }, transaction: t });
        await CallParticipant.destroy({ where: { user_id: userId }, transaction: t });
        await ScreenShareSession.destroy({ where: { shared_by: userId }, transaction: t });
        await Calendar.destroy({ where: { user_id: userId }, transaction: t });
      }

      // 4. Chat & Groups
      if (userId) {
        // Find all conversations the user was part of
        const memberships = await ConversationMember.findAll({ where: { user_id: userId }, attributes: ['conversation_id'], transaction: t });
        const convIds = memberships.map(m => m.conversation_id);

        if (convIds.length > 0) {
          // Delete all messages in these conversations (to avoid context leaks)
          await Message.destroy({ where: { conversation_id: { [Op.in]: convIds } }, transaction: t });
          // Wipe conversation memberships
          await ConversationMember.destroy({ where: { conversation_id: { [Op.in]: convIds } }, transaction: t });
          // Wipe the conversations themselves (so they don't get reused)
          await Conversation.destroy({ where: { id: { [Op.in]: convIds } }, transaction: t });
        }

        // Also delete messages sent by user in other contexts (e.g. rooms)
        await Message.destroy({ where: { sender_id: userId }, transaction: t });

        await ChatRoomMember.destroy({ where: { user_id: userId }, transaction: t });
        await GroupMember.destroy({ where: { user_id: userId }, transaction: t });
      }

      // 5. HR & Leaves
      await Leave.destroy({ where: { employee_id: empId }, transaction: t });

      // 6. System & Files
      await Document.destroy({ where: { [Op.or]: [{ uploaded_by: userId }, { employee_id: empId }] }, transaction: t });
      // DocumentVersion cleanup usually cascades or is linked to Document
      
      if (userId) {
        await Notification.destroy({ where: { user_id: userId }, transaction: t });
        await RefreshToken.destroy({ where: { user_id: userId }, transaction: t });
        if (AuditLog) await AuditLog.destroy({ where: { user_id: userId }, transaction: t });
      }

      // 7. Primary Records
      await employee.destroy({ transaction: t });
      if (userId) {
        await User.destroy({ where: { id: userId }, transaction: t });
      }

      return true;
    });
  }
}


module.exports = new EmployeeService();