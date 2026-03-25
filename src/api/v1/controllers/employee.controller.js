const employeeService = require('../../../services/employee.service');
const { success, error, paginated } = require('../../../utils/response');

// ✅ CREATE EMPLOYEE (NEW)
const create = async (req, res) => {
  try {
    const data = req.body;

    // 🔥 HANDLE FIELD MAPPING FROM FRONTEND
    if (data.name && !data.first_name) {
      const parts = data.name.trim().split(' ');
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(' ');
    }

    const employee = await employeeService.create(data);

    return success(res, employee, 'Employee created successfully', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET ALL
const getAll = async (req, res) => {
  try {
    const isEmployee = req.user.role === 'employee';
    const result = await employeeService.getAll(req.query);
    
    // 🔥 SAFE MODE: For non-admin roles, return only ID, Name, and Email
    let employees = result.employees;
    if (isEmployee) {
      employees = employees.map(emp => ({
        id: emp.id,
        user_id: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        first_name: emp.first_name,
        last_name: emp.last_name,
        user: { email: emp.user?.email, role: emp.user?.role }
      }));
    }

    return paginated(res, employees, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET BY ID
const getById = async (req, res) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    return success(res, employee);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const employee = await employeeService.getByUserId(req.user.id);
    return success(res, employee);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ UPDATE
const update = async (req, res) => {
  try {
    const data = req.body;

    // 🔥 HANDLE FIELD MAPPING FROM FRONTEND
    if (data.name && !data.first_name) {
      const parts = data.name.trim().split(' ');
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(' ');
    }

    const employee = await employeeService.update(req.params.id, data);
    return success(res, employee, 'Employee updated');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ STATS
const getStats = async (req, res) => {
  try {
    const stats = await employeeService.getStats();
    return success(res, stats);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// ✅ GET DEPARTMENTS (NEW)
const getDepartments = async (req, res) => {
  try {
    const departments = await employeeService.getDepartments();
    return success(res, departments);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ✅ GET DESIGNATIONS (NEW)
const getDesignations = async (req, res) => {
  try {
    const designations = await employeeService.getDesignations();
    return success(res, designations);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ✅ REMOVE / DELETE (NEW)
const remove = async (req, res) => {
  try {
    const id = req.params.id;
    await employeeService.delete(id);
    return success(res, null, 'Employee and all associated records permanently deleted');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

// 🔥 IMPORTANT: EXPORT ALL FUNCTIONS
module.exports = {
  create,
  getAll,
  getById,
  getMyProfile,
  update,
  getStats,
  getDepartments,
  getDesignations,
  remove
};