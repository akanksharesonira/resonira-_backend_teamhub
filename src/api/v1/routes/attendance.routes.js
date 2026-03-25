const router = require('express').Router();

const {
  checkIn,
  checkOut,
  getCurrent,
  getAttendance,
  getMyAttendance,
  getAllAttendance,
  startBreak,
  endBreak
} = require('../controllers/attendance.controller');

const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);

// Check-in / Check-out
router.post('/check-in', checkIn);
router.post('/punch-in', checkIn);       // Frontend alias
router.post('/check-out', checkOut);
router.post('/punch-out', checkOut);     // Frontend alias

// Current day's attendance (for restoring UI state on page refresh)
router.get('/current', getCurrent);

// My attendance history (paginated)
router.get('/me', getMyAttendance);

// All attendance records (admin/hr/manager only — with employee joins)
router.get('/all', authorize('super_admin', 'admin', 'administrator', 'hr', 'manager'), getAllAttendance);

// Default GET / — returns own records for employee, all for admin
router.get('/', getAttendance);

// Breaks
router.post('/break/start', startBreak);
router.put('/break/:breakId/end', endBreak);

module.exports = router;