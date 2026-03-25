const router = require('express').Router();
const { create, getAll, getMyTasks, getById, update, addComment } = require('../controllers/task.controller');
const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

// Param validation: ensure :id is a valid integer
const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid task ID. Must be a positive integer.' });
  }
  req.params.id = id; // Normalize to integer
  next();
};

router.use(authenticate);
router.post('/', authorize('admin', 'manager'), create);
router.get('/my-tasks', getMyTasks);
router.get('/', getAll);

router.get('/:id', validateIdParam, getById);
router.put('/:id', validateIdParam, update);
router.patch('/:id', validateIdParam, update);
router.post('/:id/comments', validateIdParam, addComment);

module.exports = router;
