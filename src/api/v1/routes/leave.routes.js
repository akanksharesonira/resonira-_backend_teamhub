const router = require('express').Router();

const {
  apply,
  getMyLeaves,
  getAll,
  approve,
  reject,
  getLeaveTypes
} = require('../controllers/leave.controller');

const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);

router.post('/apply', apply);
router.get('/my', getMyLeaves);
router.get('/types', getLeaveTypes);
router.get('/', authorize('super_admin', 'admin', 'hr', 'manager'), getAll);
router.post('/:id/approve', authorize('super_admin', 'admin', 'hr'), approve);
router.post('/:id/reject', authorize('super_admin', 'admin', 'hr'), reject);

module.exports = router;