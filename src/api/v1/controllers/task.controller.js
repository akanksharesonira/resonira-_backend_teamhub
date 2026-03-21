const { Task, TaskComment, Project, Employee, User } = require('../../../database/models');
const { success, error, paginated } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/validators');

const create = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assigned_by: req.user.id });
    return success(res, task, 'Task created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.priority) where.priority = req.query.priority;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'assignee', attributes: ['id', 'first_name', 'last_name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return paginated(res, rows, count, page, limit);
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
      where: { assigned_to: employee.id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) {
    return error(res, err.message);
  }
};

const getById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'assignee' },
        { model: Project, as: 'project' },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'email'] }] },
      ],
    });
    if (!task) return error(res, 'Task not found', 404);
    return success(res, task);
  } catch (err) {
    return error(res, err.message);
  }
};

const update = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return error(res, 'Task not found', 404);
    if (req.body.status === 'done') req.body.completed_at = new Date();
    await task.update(req.body);
    return success(res, task, 'Task updated');
  } catch (err) {
    return error(res, err.message);
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

module.exports = { create, getAll, getMyTasks, getById, update, addComment };
