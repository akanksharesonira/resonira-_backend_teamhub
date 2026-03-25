const sequelize = require('../../config/database');

// ─── Import All Models ──────────────────────────────────────
const Organization = require('./Organization');
const Role = require('./Role');
const Permission = require('./Permission');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Employee = require('./Employee');
const Department = require('./Department');
const Designation = require('./Designation');
const Attendance = require('./Attendance');
const AttendanceBreak = require('./AttendanceBreak');
const Leave = require('./Leave');
const LeaveType = require('./LeaveType');
const Holiday = require('./Holiday');
const Message = require('./Message');
const ChatRoom = require('./ChatRoom');
const ChatRoomMember = require('./ChatRoomMember');
const Conversation = require('./Conversation');
const ConversationMember = require('./ConversationMember');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Meeting = require('./Meeting');
const MeetingParticipant = require('./MeetingParticipant');
const MeetingActionItem = require('./MeetingActionItem');
const MeetingTranscript = require('./MeetingTranscript');
const Task = require('./Task');
const TaskComment = require('./TaskComment');
const Project = require('./Project');
const Document = require('./Document');
const DocumentVersion = require('./DocumentVersion');
const Calendar = require('./Calendar');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Call = require('./Call');
const CallParticipant = require('./CallParticipant');
const ScreenShareSession = require('./ScreenShareSession');

// ─── Associations ───────────────────────────────────────────

// Organization
Organization.hasMany(Department, { foreignKey: 'organization_id', as: 'departments' });
Department.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// Role <-> Permission
Role.hasMany(Permission, { foreignKey: 'role_id', as: 'permissions' });
Permission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Employee
User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Department <-> Employee
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Designation <-> Employee
Designation.hasMany(Employee, { foreignKey: 'designation_id', as: 'employees' });
Employee.belongsTo(Designation, { foreignKey: 'designation_id', as: 'designation' });

// Department <-> Designation
Department.hasMany(Designation, { foreignKey: 'department_id', as: 'designations' });
Designation.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Attendance
Employee.hasMany(Attendance, { foreignKey: 'employee_id', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// AttendanceBreak
Attendance.hasMany(AttendanceBreak, { foreignKey: 'attendance_id', as: 'breaks' });
AttendanceBreak.belongsTo(Attendance, { foreignKey: 'attendance_id', as: 'attendance' });

// Leave
Employee.hasMany(Leave, { foreignKey: 'employee_id', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// LeaveType
LeaveType.hasMany(Leave, { foreignKey: 'leave_type_id', as: 'leaveRequests' });
Leave.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });

// Messaging
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(Employee, { foreignKey: 'sender_id', as: 'sender' });

// Chat
ChatRoom.hasMany(Message, { foreignKey: 'chat_room_id', as: 'messages' });
Message.belongsTo(ChatRoom, { foreignKey: 'chat_room_id', as: 'chatRoom' });

// Chat Members
ChatRoom.hasMany(ChatRoomMember, { foreignKey: 'chat_room_id', as: 'members' });
ChatRoomMember.belongsTo(ChatRoom, { foreignKey: 'chat_room_id', as: 'chatRoom' });

User.hasMany(ChatRoomMember, { foreignKey: 'user_id', as: 'chatRoomMemberships' });
ChatRoomMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Conversations
Conversation.hasMany(ConversationMember, { foreignKey: 'conversation_id', as: 'members' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

User.hasMany(ConversationMember, { foreignKey: 'user_id', as: 'conversationMemberships' });
ConversationMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Groups
Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'members' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'groupMemberships' });
GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Calendar
User.hasMany(Calendar, { foreignKey: 'user_id', as: 'calendarEvents' });
Calendar.belongsTo(User, { foreignKey: 'user_id', as: 'user' });


// Meeting
Meeting.hasMany(MeetingParticipant, { foreignKey: 'meeting_id', as: 'participants' });
MeetingParticipant.belongsTo(Meeting, { foreignKey: 'meeting_id', as: 'meeting' });
User.hasMany(MeetingParticipant, { foreignKey: 'user_id', as: 'meetingMemberships' });
MeetingParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Meeting, { foreignKey: 'organizer_id', as: 'organizedMeetings' });
Meeting.belongsTo(User, { foreignKey: 'organizer_id', as: 'organizer' });

// Project
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Task
Employee.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
Task.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignee' });
Employee.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
Task.belongsTo(Employee, { foreignKey: 'createdBy', as: 'creator' });



// TaskComment
Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
User.hasMany(TaskComment, { foreignKey: 'user_id', as: 'taskComments' });
TaskComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ─── Export ─────────────────────────────────────────────────
module.exports = {
  sequelize,
  Organization,
  Role,
  Permission,
  User,
  RefreshToken,
  Employee,
  Department,
  Designation,
  Attendance,
  AttendanceBreak,
  Leave,
  LeaveType,
  Holiday,
  Message,
  ChatRoom,
  ChatRoomMember,
  Conversation,
  ConversationMember,
  Group,
  GroupMember,
  Meeting,
  MeetingParticipant,
  MeetingActionItem,
  MeetingTranscript,
  Task,
  TaskComment,
  Project,
  Document,
  DocumentVersion,
  Calendar,
  Notification,
  AuditLog,
  Call,
  CallParticipant,
  ScreenShareSession,
};