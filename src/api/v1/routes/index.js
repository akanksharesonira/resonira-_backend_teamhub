const router = require('express').Router();

//  Auth
router.use('/auth', require('./auth.routes'));

// Employee
router.use('/employees', require('./employee.routes'));

//Department
router.use('/departments', require('./department.routes'));

//Designation
router.use('/designations', require('./designation.routes')); 

// Attendance
router.use('/attendance', require('./attendance.routes'));

// Leaves
router.use('/leaves', require('./leave.routes'));

// Tasks
router.use('/tasks', require('./task.routes'));

// Meetings
router.use('/meetings', require('./meeting.routes'));

//  Communication
router.use('/communication', require('./communication.routes'));

//  Groups
router.use('/groups', require('./group.routes'));

//  Calendar
router.use('/calendar', require('./calendar.routes'));

//calling
router.use('/calling',require('./calling.routes'));

//  Documents
router.use('/documents', require('./document.routes'));

//  Notifications
router.use('/notifications', require('./notification.routes'));

//  Analytics
router.use('/analytics', require('./analytics.routes'));

// Admin
router.use('/admin', require('./admin.routes'));

//  Calls
router.use('/calls', require('./calling.routes'));

//  Screenshare
router.use('/screenshare', require('./screenshare.routes'));

module.exports = router;