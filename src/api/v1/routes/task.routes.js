const router = require('express').Router();
const { create, getAll, getMyTasks, getById, update, addComment } = require('../controllers/task.controller');
const authenticate = require('../../../middleware/auth.middleware');

router.use(authenticate);
router.post('/', create);
router.get('/', getAll);
router.get('/my', getMyTasks);
router.get('/:id', getById);
router.put('/:id', update);
router.post('/:id/comments', addComment);

module.exports = router;
