const router = require('express').Router();

const {
  create,
  getAll,
  getById,
  update,
  remove
} = require('../controllers/designation.controller');

const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);

router.post('/', authorize('super_admin', 'admin', 'administrator', 'hr'), create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', authorize('super_admin', 'admin', 'administrator', 'hr'), update);
router.delete('/:id', authorize('super_admin', 'admin', 'administrator', 'hr'), remove);

module.exports = router;