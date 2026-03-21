const router = require('express').Router();
const { startSession, stopSession, getActiveByCall } = require('../controllers/screenshare.controller');
const authenticate = require('../../../middleware/auth.middleware');

router.use(authenticate);
router.post('/start', startSession);
router.post('/:id/stop', stopSession);
router.get('/call/:callId', getActiveByCall);

module.exports = router;
