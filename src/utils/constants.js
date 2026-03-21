module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    HR: 'hr',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
  },

  CALL_STATUS: {
    RINGING: 'ringing',
    ONGOING: 'ongoing',
    ENDED: 'ended',
    MISSED: 'missed',
    REJECTED: 'rejected',
  },

  CALL_TYPES: {
    AUDIO: 'audio',
    VIDEO: 'video',
  },

  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    DONE: 'done',
    CANCELLED: 'cancelled',
  },

  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  },

  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half_day',
    WFH: 'wfh',
    ON_LEAVE: 'on_leave',
  },

  MEETING_STATUS: {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
};
