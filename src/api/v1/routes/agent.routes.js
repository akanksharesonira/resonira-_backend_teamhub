const router = require('express').Router();
const { chatWithAgent } = require('../controllers/agent.controller');
const authenticate = require('../../../middleware/auth.middleware');

// Protect the AI endpoint
router.use(authenticate);

// Main chat route
router.post('/chat', chatWithAgent);

module.exports = router;
