const router = require('express').Router();

const {
  initiateCall,
  joinCall,
  leaveCall,
  endCall,
  getCallHistory,
  getIceServers
} = require('../controllers/calling.controller');

const authenticate = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { initiateCallSchema } = require('../validators/calling.validator');

//  Protect all routes
router.use(authenticate);

/**
 *  CALLING ROUTES
 */

//  INITIATE CALL
router.post('/initiate', validate(initiateCallSchema), initiateCall);

// JOIN CALL
router.post('/:id/join', joinCall);

// LEAVE CALL
router.post('/:id/leave', leaveCall);

//  END CALL
router.post('/:id/end', endCall);

//  CALL HISTORY
router.get('/history', getCallHistory);

//  ICE SERVERS
router.get('/ice-servers', getIceServers);

module.exports = router;