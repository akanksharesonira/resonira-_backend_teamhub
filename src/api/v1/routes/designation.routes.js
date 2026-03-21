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

router.post('/', authorize('admin', 'super_admin'), create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', authorize('admin', 'super_admin'), update);
router.delete('/:id', authorize('admin', 'super_admin'), remove);

module.exports = router;