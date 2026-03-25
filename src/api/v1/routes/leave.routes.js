const router = require('express').Router();

const {
  apply,
  getMyLeaves,
  getBalance,
  getLeaves,
  updateStatus, // New generic status update
  approve,
  reject,
  getLeaveTypes
} = require('../controllers/leave.controller');

const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);

// Debug Log
router.use((req, res, next) => {
  console.log(`[LEAVE-ROUTE] Request: ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/apply', apply);
router.post('/', apply); // Explicit endpoint per requirement
router.get('/my', getMyLeaves);
router.get('/balance', getBalance); // New balance endpoint
router.get('/types', getLeaveTypes);
router.get('/', getLeaves); // Role-aware base route

// Status Updates
router.patch('/:id/status', authorize('super_admin', 'admin', 'administrator', 'hr'), updateStatus);
router.post('/:id/status', authorize('super_admin', 'admin', 'administrator', 'hr'), updateStatus); // Alias if frontend uses POST

router.post('/:id/approve', authorize('super_admin', 'admin', 'administrator', 'hr'), approve);
router.post('/:id/reject', authorize('super_admin', 'admin', 'administrator', 'hr'), reject);

module.exports = router;