const router = require('express').Router();

const {
  create,
  getMyEvents,
  getById,
  update,
  remove
} = require('../controllers/calendar.controller');

const authenticate = require('../../../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticate);

/**
 *  CALENDAR ROUTES
 */

//  CREATE EVENT
router.post('/', create);

// GET MY EVENTS
router.get('/my', getMyEvents);

//  GET EVENT BY ID
router.get('/:id', getById);

//  UPDATE EVENT
router.put('/:id', update);

// DELETE EVENT
router.delete('/:id', remove);

module.exports = router;