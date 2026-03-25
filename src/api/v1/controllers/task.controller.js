const { Task, TaskComment, Project, Employee, User, Department, Designation } = require('../../../database/models');
const Joi = require('joi');

const { success, error, paginated } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/validators');

// ── Status Constants ──────────────────────────────────────────
const VALID_STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'];

// Maps legacy/frontend shorthand → DB ENUM value
const STATUS_MAP = {
  'todo': 'todo',
  'progress': 'in_progress',
  'in_progress': 'in_progress',
  'in progress': 'in_progress',
  'review': 'in_review',
  'in_review': 'in_review',
  'in review': 'in_review',
  'done': 'done',
  'completed': 'done',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
};

// Joi schema for task update payload
const taskUpdateSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid(...Object.keys(STATUS_MAP)).insensitive().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').insensitive().optional(),
  assignedTo: Joi.alternatives().try(Joi.number().integer(), Joi.string(), Joi.object()).optional(),
  assigned_to: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  due_date: Joi.date().allow(null).optional(),
  deadline: Joi.date().allow(null).optional(),
  project_id: Joi.number().integer().allow(null).optional(),
  category: Joi.string().allow('', null).optional(),
  attachments: Joi.array().optional(),
}).unknown(true);

const create = async (req, res) => {
  try {
    let { assignedTo, title, description, priority, due_date, deadline, project_id } = req.body;
    
    // 1. Payload Normalization & Aliasing
    if (deadline && !due_date) due_date = deadline; // Alias deadline -> due_date
    
    if (assignedTo && typeof assignedTo === 'object' && assignedTo._id) {
        assignedTo = assignedTo._id; // Extract _id if sent as object
    }

    // 2. Validation
    if (!assignedTo) return error(res, 'assignedTo is required', 400);
    if (!title) return error(res, 'title is required', 400);

    // 3. Identity Normalization (User -> Employee)
    // Find the Employee record for the requester (createdBy)
    const creatorEmployee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!creatorEmployee) {
        return error(res, 'Your user profile is not linked to an employee record. Task cannot be created.', 400);
    }

    // Validate if assignedTo refers to a valid employee (try Employee ID first, then User ID fallback)
    let assignedEmployee = await Employee.findByPk(assignedTo);
    if (!assignedEmployee) {
        // Fallback: Check if assignedTo was actually a User ID
        assignedEmployee = await Employee.findOne({ where: { user_id: assignedTo } });
    }

    if (!assignedEmployee) {
        return error(res, 'Target employee not found.', 404);
    }
    
    // Ensure we use the actual Employee ID for the DB
    assignedTo = assignedEmployee.id;

    // 4. Create Task
    const taskData = {
      title,
      description,
      assignedTo,
      priority,
      due_date,
      project_id,
      createdBy: creatorEmployee.id
    };

    const task = await Task.create(taskData);
    
    // Fetch newly created task with full info for response
    const fullTask = await getTaskWithFullInfo(task.id);
    return success(res, fullTask, 'Task created', 201);
    
  } catch (err) {
    console.error(`[TASK-CREATE-ERROR] ${err.name}: ${err.message}`);
    // Specifically handle DB constraint/validation errors as 400
    if (err.name.includes('SequelizeForeignKeyConstraintError') || err.name.includes('ValidationError')) {
        return error(res, `Database constraint error: ${err.message}`, 400);
    }
    return error(res, err.message, 500);
  }
};


const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.priority) where.priority = req.query.priority;

    // 🔥 RBAC filtering for employees
    if (req.user.role === 'employee' || req.user.role === 'Employee') {
      const employee = await Employee.findOne({ where: { user_id: req.user.id } });
      if (employee) {
        where.assignedTo = employee.id;
      } else {
        // If no employee record, they should see nothing (or we could return 404)
        where.assignedTo = -1; 
      }
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: fullInclude,
      order: [['created_at', 'DESC']],
      limit, offset,
    });

    const mappedRows = rows.map(mapTaskResponse);
    return paginated(res, mappedRows, count, page, limit);
  } catch (err) {
    return error(res, err.message);
  }
};


const getMyTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    if (!employee) return error(res, 'Employee not found', 404);

    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await Task.findAndCountAll({
      where: { assignedTo: employee.id },
      include: fullInclude,
      order: [['created_at', 'DESC']],
      limit, offset,
    });

    const mappedRows = rows.map(mapTaskResponse);
    return paginated(res, mappedRows, count, page, limit);
  } catch (err) {
    return error(res, err.message);
  }
};

const getById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        ...fullInclude,
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'email'] }] },
      ],
    });

    if (!task) return error(res, 'Task not found', 404);
    return success(res, mapTaskResponse(task));

  } catch (err) {
    return error(res, err.message);
  }
};

const update = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return error(res, 'Task not found', 404);

    // 0. Joi Validation
    const { error: validationError } = taskUpdateSchema.validate(req.body, { abortEarly: false });
    if (validationError) {
      const messages = validationError.details.map(d => d.message).join('; ');
      return error(res, `Validation failed: ${messages}`, 400);
    }

    // 1. Payload Normalization
    let updateData = { ...req.body };

    // ── STATUS MAPPING (Critical Fix) ──
    if (updateData.status) {
      const mappedStatus = STATUS_MAP[updateData.status.toLowerCase().trim()];
      if (!mappedStatus) {
        return error(res, `Invalid status "${updateData.status}". Allowed: ${VALID_STATUSES.join(', ')}`, 400);
      }
      console.log(`[TASK-UPDATE] Status mapped: "${updateData.status}" → "${mappedStatus}"`);
      updateData.status = mappedStatus;
    }

    // Alias deadline -> due_date
    if (updateData.deadline && !updateData.due_date) {
      updateData.due_date = updateData.deadline;
    }
    delete updateData.deadline;

    // Normalize assignedTo: handle { _id: "..." } or string
    if (updateData.assignedTo) {
      if (typeof updateData.assignedTo === 'object' && updateData.assignedTo._id) {
        updateData.assignedTo = updateData.assignedTo._id;
      }
      updateData.assignedTo = parseInt(updateData.assignedTo, 10);
      if (isNaN(updateData.assignedTo)) {
        return error(res, 'assignedTo must be a valid ID', 400);
      }
      
      let assignedEmployee = await Employee.findByPk(updateData.assignedTo);
      if (!assignedEmployee) {
        // User ID fallback
        assignedEmployee = await Employee.findOne({ where: { user_id: updateData.assignedTo } });
      }

      if (!assignedEmployee) {
        return error(res, 'Assigned employee not found', 404);
      }
      updateData.assignedTo = assignedEmployee.id;
    }

    // Auto-set completed_at when status changes to done
    if (updateData.status === 'done') {
      updateData.completed_at = new Date();
    }

    // 2. Prevent updating protected fields
    delete updateData.id;
    delete updateData.createdBy;
    delete updateData.created_at;
    delete updateData.assigned_to; // Frontend may send this; DB uses 'assignedTo'

    await task.update(updateData);

    // 3. Return fully populated response
    const fullTask = await getTaskWithFullInfo(task.id);
    return success(res, fullTask, 'Task updated');

  } catch (err) {
    console.error(`[TASK-UPDATE-ERROR] ${err.name}: ${err.message}`);
    if (err.name && (err.name.includes('SequelizeForeignKeyConstraintError') || err.name.includes('ValidationError') || err.name.includes('SequelizeDatabaseError'))) {
      return error(res, `Database constraint error: ${err.message}`, 400);
    }
    return error(res, err.message, 500);
  }
};

const addComment = async (req, res) => {
  try {
    const comment = await TaskComment.create({
      task_id: req.params.id,
      user_id: req.user.id,
      content: req.body.content,
      attachment_url: req.body.attachment_url,
    });
    return success(res, comment, 'Comment added', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// Helper to include full employee info
const fullInclude = [
  { 
    model: Employee, 
    as: 'assignee', 
    attributes: ['id', 'first_name', 'last_name'],
    include: [{ 
      model: User, 
      as: 'user', 
      attributes: ['id', 'email'],
    }]
  },
  { model: Project, as: 'project', attributes: ['id', 'name'] },
];


const getTaskWithFullInfo = async (id) => {
  const task = await Task.findByPk(id, { include: fullInclude });
  return mapTaskResponse(task);
};

const mapTaskResponse = (task) => {
  if (!task) return null;
  const taskData = task.toJSON();
  
  // 🔥 STANDARD: assignedTo: { _id, name, email }
  if (taskData.assignee) {
    const emp = taskData.assignee;
    taskData.assignedTo = {
      _id: emp.id,
      userId: emp.user?.id || emp.user_id, // Add User ID for frontend consistency
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unassigned',
      email: emp.user?.email || 'N/A'
    };
  } else {

    // According to requirements: "NEVER return: assignedTo: null"
    // So if really null, return default Object or handle
    taskData.assignedTo = { _id: null, name: 'Unassigned', email: 'N/A' };
  }

  // Remove legacy/redundant fields
  delete taskData.assignee;
  delete taskData.assigned_to; // Just in case it sneaks in
  delete taskData.assigned_by; // Use createdBy

  return taskData;
};

module.exports = { create, getAll, getMyTasks, getById, update, addComment };


