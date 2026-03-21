const router = require('express').Router();
const { create, getAll, addMember, removeMember } = require('../controllers/group.controller');
const authenticate = require('../../../middleware/auth.middleware');

router.use(authenticate);
router.post('/', create);
router.get('/', getAll);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
