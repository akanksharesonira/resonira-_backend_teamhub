const router = require('express').Router();
const { getUsers, updateUserRole, toggleUserStatus, getDepartments, createDepartment, getRoles, getHolidays, createHoliday } = require('../controllers/admin.controller');
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/rbac.middleware');

router.use(authenticate);
router.use(authorize('super_admin', 'admin'));
router.get('/users', getUsers);
router.post('/users', employeeController.create);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.get('/roles', getRoles);
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);

module.exports = router;
