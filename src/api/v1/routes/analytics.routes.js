const router = require('express').Router();
const { getDashboard, getAttendanceReport, getLeaveReport, getTaskReport } = require('../controllers/analytics.controller');
const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);
router.use(authorize('super_admin', 'admin', 'hr'));
router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendanceReport);
router.get('/leaves', getLeaveReport);
router.get('/tasks', getTaskReport);

module.exports = router;
