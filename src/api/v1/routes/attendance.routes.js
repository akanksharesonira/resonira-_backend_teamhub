const router = require('express').Router();

const {
  checkIn,
  checkOut,
  getMyAttendance,
  startBreak,
  endBreak
} = require('../controllers/attendance.controller');

const authenticate = require('../../../middleware/auth.middleware');

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/me', getMyAttendance);

router.post('/break/start', startBreak);
router.put('/break/:breakId/end', endBreak);

module.exports = router;