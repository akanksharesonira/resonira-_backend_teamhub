const { Notification } = require('../database/models');
const { parsePagination } = require('../utils/validators');

class NotificationService {

  /**
   * Create single notification
   */
  async create(data) {
    return await Notification.create({
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      is_read: false
    });
  }

  /**
   * Bulk create notifications
   */
  async createBulk(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    return await Notification.bulkCreate(notifications);
  }

  /**
   * Get notifications (paginated)
   */
  async getByUserId(userId, query) {
    const { page, limit, offset } = parsePagination(query);

    const where = { user_id: userId };

    if (query.is_read !== undefined) {
      where.is_read = query.is_read === 'true';
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      notifications: rows,
      total: count,
      page,
      limit
    };
  }

  /**
   * 🔥 FINAL: Mark as read OR create if not exists
   */
  async markAsRead(notificationId, userId) {
    const id = parseInt(notificationId, 10);

    if (!id) {
      throw {
        message: 'Invalid notification ID',
        statusCode: 400
      };
    }

    let notification = await Notification.findByPk(id);

    // 🔥 CREATE IF NOT EXISTS
    if (!notification) {
      notification = await Notification.create({
        user_id: userId,
        title: "Auto Generated",
        message: "Created via markAsRead API",
        type: "info",
        is_read: true
      });

      return notification;
    }

    // 🔒 Ownership check
    if (notification.user_id !== userId) {
      throw {
        message: 'Unauthorized access to notification',
        statusCode: 403
      };
    }

    // ✅ Update only if needed
    if (!notification.is_read) {
      await notification.update({ is_read: true });
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return {
      updatedCount
    };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    return { count };
  }
}

module.exports = new NotificationService();