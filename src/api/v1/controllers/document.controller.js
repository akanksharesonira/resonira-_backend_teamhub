const path = require('path');
const fs = require('fs');

const models = require('../../../database/models');

const Document = models.Document;
const DocumentVersion = models.DocumentVersion;
const Employee = models.Employee;
const sequelize = models.sequelize;

const { success, error, paginated } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/validators');
const storageService = require('../../../services/storage.service');

/**
 * ✅ UPLOAD DOCUMENT
 */
const upload = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    // ✅ Extract clean file type (.pdf, .docx, etc.)
    const fileType = path.extname(req.file.originalname).toLowerCase();

    // ✅ Optional: validate employee
    if (req.body.employee_id) {
      const emp = await Employee.findByPk(req.body.employee_id);
      if (!emp) {
        return error(res, 'Invalid employee_id', 400);
      }
    }

    const doc = await Document.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || null,

      file_url: storageService.getFileUrl(req.file.filename),
      file_name: req.file.originalname,
      file_type: fileType, // ✅ FIXED
      file_size: req.file.size,

      category: req.body.category || null,

      uploaded_by: req.user.id,
      employee_id: req.body.employee_id || null,
      department_id: req.body.department_id || null,

      is_deleted: false
    }, { transaction });

    // ✅ Optional: create version
    await DocumentVersion.create({
      document_id: doc.id,
      file_url: doc.file_url,
      version_number: 1,
      uploaded_by: req.user.id
    }, { transaction });

    await transaction.commit();

    return success(res, doc, 'Document uploaded', 201);

  } catch (err) {
    await transaction.rollback();

    // 🧹 Cleanup uploaded file if DB fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    console.error('Upload Document Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ GET ALL DOCUMENTS
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = { is_deleted: false };

    if (req.query.category) {
      where.category = req.query.category;
    }

    const { count, rows } = await Document.findAndCountAll({
      where,
      include: [
        {
          model: DocumentVersion,
          as: 'versions'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, count, page, limit);

  } catch (err) {
    console.error('Get Documents Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ GET DOCUMENT BY ID
 */
const getById = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id, {
      include: [
        {
          model: DocumentVersion,
          as: 'versions'
        }
      ]
    });

    if (!doc || doc.is_deleted) {
      return error(res, 'Document not found', 404);
    }

    return success(res, doc);

  } catch (err) {
    console.error('Get Document Error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * ✅ SOFT DELETE DOCUMENT
 */
const softDelete = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);

    if (!doc || doc.is_deleted) {
      return error(res, 'Document not found', 404);
    }

    await doc.update({ is_deleted: true });

    return success(res, null, 'Document deleted');

  } catch (err) {
    console.error('Delete Document Error:', err);
    return error(res, err.message, 500);
  }
};

module.exports = {
  upload,
  getAll,
  getById,
  softDelete
};