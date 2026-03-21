const router = require('express').Router();
const authenticate = require('../../../middleware/auth.middleware');

const {
  create,
  getAll,
  getById,
  update,
  remove,
  addParticipants,
  getParticipants,
  removeParticipant,
  updateStatus
} = require('../controllers/meeting.controller');

router.use(authenticate);

// CRUD
router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

// PARTICIPANTS
router.post('/:id/participants', addParticipants);
router.get('/:id/participants', getParticipants);
router.delete('/:id/participants/:userId', removeParticipant);

// 🔥 THIS IS THE IMPORTANT LINE
router.patch('/:id/participants/status', updateStatus);

module.exports = router;