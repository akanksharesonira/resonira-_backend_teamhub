const notificationService = require('../../../services/notification.service');
const { success, error, paginated } = require('../../../utils/response');

/**
 * @desc Get all notifications for logged-in user
 */
const getAll = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return error(res, 'Unauthorized', 401);
    }

    const result = await notificationService.getByUserId(userId, req.query);

    return paginated(
      res,
      result.notifications,
      result.total,
      result.page,
      result.limit
    );
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    return error(res, err.message || 'Failed to fetch notifications', err.statusCode || 500);
  }
};

/**
 * @desc Mark single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = Number(req.params.id);

    // 🔍 DEBUG LOGS (IMPORTANT)
    console.log("PARAM ID:", req.params.id);
    console.log("PARSED ID:", notificationId);
    console.log("TOKEN USER ID:", userId);

    if (!userId) {
      return error(res, 'Unauthorized', 401);
    }

    if (!notificationId || isNaN(notificationId)) {
      return error(res, 'Invalid notification ID', 400);
    }

    const notification = await notificationService.markAsRead(
      notificationId,
      userId
    );

    return success(res, notification, 'Notification marked as read');
  } catch (err) {
    console.error('MARK AS READ ERROR:', err);

    // ✅ Better structured error response
    return error(
      res,
      err.message || 'Failed to update notification',
      err.statusCode || 500
    );
  }
};

/**
 * @desc Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return error(res, 'Unauthorized', 401);
    }

    const result = await notificationService.markAllAsRead(userId);

    return success(res, result, 'All notifications marked as read');
  } catch (err) {
    console.error('MARK ALL AS READ ERROR:', err);
    return error(res, err.message || 'Failed to update notifications', err.statusCode || 500);
  }
};

/**
 * @desc Get unread notifications count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return error(res, 'Unauthorized', 401);
    }

    const result = await notificationService.getUnreadCount(userId);

    return success(res, result);
  } catch (err) {
    console.error('UNREAD COUNT ERROR:', err);
    return error(res, err.message || 'Failed to fetch unread count', err.statusCode || 500);
  }
};

module.exports = {
  getAll,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};