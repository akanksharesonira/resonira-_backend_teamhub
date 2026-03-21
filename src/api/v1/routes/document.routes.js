const router = require('express').Router();
const { upload, getAll, getById, softDelete } = require('../controllers/document.controller');
const authenticate = require('../../../middleware/auth.middleware');
const uploadMiddleware = require('../../../middleware/upload.middleware');

router.use(authenticate);
router.post('/', uploadMiddleware.single('file'), upload);
router.get('/', getAll);
router.get('/:id', getById);
router.delete('/:id', softDelete);

module.exports = router;
