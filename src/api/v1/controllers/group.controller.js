const { Group, GroupMember, User, sequelize } = require('../../../database/models');
const { success, error } = require('../../../utils/response');

/**
 * ✅ CREATE GROUP
 */
const create = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, member_ids = [] } = req.body;
    const userId = req.user?.id;

    if (!userId) return error(res, 'Unauthorized', 401);
    if (!name) return error(res, 'Group name is required', 400);

    const group = await Group.create(
      {
        name,
        created_by: userId,
        is_active: true
      },
      { transaction }
    );

    await GroupMember.create(
      {
        group_id: group.id,
        user_id: userId,
        role: 'admin'
      },
      { transaction }
    );

    if (Array.isArray(member_ids) && member_ids.length > 0) {
      const uniqueMembers = [...new Set(member_ids.filter(id => id !== userId))];

      const members = uniqueMembers.map(uid => ({
        group_id: group.id,
        user_id: uid,
        role: 'member'
      }));

      await GroupMember.bulkCreate(members, { transaction });
    }

    await transaction.commit();
    return success(res, group, 'Group created successfully', 201);

  } catch (err) {
    await transaction.rollback();
    console.error('CREATE GROUP ERROR:', err);
    return error(res, err.message || 'Failed to create group', 500);
  }
};

/**
 * ✅ GET ALL GROUPS
 */
const getAll = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return error(res, 'Unauthorized', 401);

    const groups = await Group.findAll({
      where: { is_active: true },
      include: [
        {
          model: GroupMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email']
            }
          ]
        }
      ]
    });

    return success(res, groups);

  } catch (err) {
    console.error('GET GROUPS ERROR:', err);
    return error(res, err.message || 'Failed to fetch groups', 500);
  }
};

/**
 * ✅ ADD MEMBER (BEST VERSION)
 */
const addMember = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const groupId = Number(req.params.id);
    const { user_id, user_ids } = req.body;
    const currentUser = req.user?.id;

    if (!currentUser) return error(res, 'Unauthorized', 401);

    if (!groupId || (!user_id && !user_ids)) {
      return error(res, 'Group ID and User ID(s) are required', 400);
    }

    // 🔐 Admin check
    const admin = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: currentUser,
        role: 'admin'
      }
    });

    if (!admin) {
      return error(res, 'Only admin can add members', 403);
    }

    // Normalize users
    const users = user_ids || [user_id];
    const uniqueUsers = [...new Set(users.filter(Boolean))];

    // Find existing
    const existingMembers = await GroupMember.findAll({
      where: {
        group_id: groupId,
        user_id: uniqueUsers
      },
      attributes: ['user_id']
    });

    const existingIds = existingMembers.map(m => m.user_id);

    // Split lists
    const newUsers = uniqueUsers.filter(id => !existingIds.includes(id));

    // Insert new users
    let addedMembers = [];
    if (newUsers.length > 0) {
      const membersData = newUsers.map(uid => ({
        group_id: groupId,
        user_id: uid,
        role: 'member'
      }));

      addedMembers = await GroupMember.bulkCreate(membersData, { transaction });
    }

    await transaction.commit();

    return success(res, {
      message:
        addedMembers.length > 0
          ? 'Members added successfully'
          : 'No new users added',
      added: addedMembers,
      alreadyExists: existingIds
    });

  } catch (err) {
    await transaction.rollback();
    console.error('ADD MEMBER ERROR:', err);
    return error(res, err.message || 'Failed to add members', 500);
  }
};

/**
 * ✅ REMOVE MEMBER
 */
const removeMember = async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const userIdToRemove = Number(req.params.userId);
    const currentUser = req.user?.id;

    if (!currentUser) return error(res, 'Unauthorized', 401);

    const admin = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: currentUser,
        role: 'admin'
      }
    });

    if (!admin) {
      return error(res, 'Only admin can remove members', 403);
    }

    const deleted = await GroupMember.destroy({
      where: {
        group_id: groupId,
        user_id: userIdToRemove
      }
    });

    if (!deleted) {
      return error(res, 'Member not found', 404);
    }

    return success(res, null, 'Member removed successfully');

  } catch (err) {
    console.error('REMOVE MEMBER ERROR:', err);
    return error(res, err.message || 'Failed to remove member', 500);
  }
};

module.exports = {
  create,
  getAll,
  addMember,
  removeMember
};