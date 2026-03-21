const { Department } = require('../database/models');

class DepartmentService {

  // ✅ CREATE
  async create(data) {
    if (!data.name) {
      throw { statusCode: 400, message: 'Department name is required' };
    }

    const existing = await Department.findOne({
      where: { name: data.name }
    });

    if (existing) {
      throw { statusCode: 400, message: 'Department already exists' };
    }

    const department = await Department.create({
      name: data.name,
      is_active: true
    });

    return department;
  }

  // ✅ GET ALL
  async getAll() {
    return await Department.findAll();
  }

  // ✅ GET BY ID
  async getById(id) {
    const department = await Department.findByPk(id);

    if (!department) {
      throw { statusCode: 404, message: 'Department not found' };
    }

    return department;
  }

  // ✅ UPDATE
  async update(id, data) {
    const department = await Department.findByPk(id);

    if (!department) {
      throw { statusCode: 404, message: 'Department not found' };
    }

    await department.update(data);
    return department;
  }

  // ✅ DELETE
  async delete(id) {
    const department = await Department.findByPk(id);

    if (!department) {
      throw { statusCode: 404, message: 'Department not found' };
    }

    await department.destroy();
    return { message: 'Department deleted successfully' };
  }
}

module.exports = new DepartmentService();