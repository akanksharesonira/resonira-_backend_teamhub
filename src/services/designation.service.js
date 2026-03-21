const { Designation } = require('../database/models');

class DesignationService {

  // ✅ CREATE
  async create(data) {
    if (!data.name) {
      throw { statusCode: 400, message: 'Designation name is required' };
    }

    const existing = await Designation.findOne({
      where: { name: data.name }
    });

    if (existing) {
      throw { statusCode: 400, message: 'Designation already exists' };
    }

    const designation = await Designation.create({
      name: data.name,
      is_active: true
    });

    return designation;
  }

  // ✅ GET ALL
  async getAll() {
    return await Designation.findAll();
  }

  // ✅ GET BY ID
  async getById(id) {
    const designation = await Designation.findByPk(id);

    if (!designation) {
      throw { statusCode: 404, message: 'Designation not found' };
    }

    return designation;
  }

  // ✅ UPDATE
  async update(id, data) {
    const designation = await Designation.findByPk(id);

    if (!designation) {
      throw { statusCode: 404, message: 'Designation not found' };
    }

    await designation.update(data);
    return designation;
  }

  // ✅ DELETE
  async delete(id) {
    const designation = await Designation.findByPk(id);

    if (!designation) {
      throw { statusCode: 404, message: 'Designation not found' };
    }

    await designation.destroy();
    return { message: 'Designation deleted successfully' };
  }
}

module.exports = new DesignationService();