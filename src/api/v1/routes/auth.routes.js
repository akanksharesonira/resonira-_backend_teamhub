const router = require('express').Router();
const { register, login, refreshToken, getProfile, changePassword } = require('../controllers/auth.controller');
const authenticate = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { authLimiter } = require('../../../middleware/rateLimit.middleware');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
