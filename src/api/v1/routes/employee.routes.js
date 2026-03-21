const router = require('express').Router();

const {
  getAll,
  getById,
  getMyProfile,
  update,
  getStats,
  create
} = require('../controllers/employee.controller');

const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);

router.get('/me', getMyProfile);
router.get('/stats', authorize('super_admin', 'admin', 'hr'), getStats);
router.get('/', authorize('super_admin', 'admin', 'hr', 'manager'), getAll);

router.post('/', authorize('super_admin', 'admin', 'hr'), create);

router.get('/:id', getById);
router.put('/:id', authorize('super_admin', 'admin', 'hr'), update);

module.exports = router;