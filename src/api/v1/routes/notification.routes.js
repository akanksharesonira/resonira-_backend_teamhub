const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const authenticate = require('../../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/unread-count', controller.getUnreadCount);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);

module.exports = router;