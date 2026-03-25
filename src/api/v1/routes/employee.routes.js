const router = require('express').Router();

const {
  getAll,
  getById,
  getMyProfile,
  update,
  getStats,
  create,
  getDepartments,
  getDesignations,
  remove: removeEmployee
} = require('../controllers/employee.controller');


const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');
const { validateCreateEmployee } = require('../validators/employee.validator');

router.use(authenticate);

// 🚨 MOVE DELETE TO TOP FOR PRIORITY
router.delete('/:id', authorize('super_admin', 'admin', 'administrator'), removeEmployee);

router.get('/me', getMyProfile);
router.get('/stats', authorize('super_admin', 'admin', 'administrator', 'hr'), getStats);
router.get('/departments', getDepartments);
router.get('/designations', getDesignations);

router.get('/', getAll);
router.post('/', authorize('super_admin', 'admin', 'administrator', 'hr'), validateCreateEmployee, create);

router.get('/:id', getById);
router.put('/:id', authorize('super_admin', 'admin', 'administrator', 'hr'), update);

module.exports = router;