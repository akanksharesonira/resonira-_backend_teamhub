const Queue = require('bull');
const env = require('../config/env');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const { getRedis } = require('../config/redis');

let notificationQueue;

try {
  if (getRedis()) {
    notificationQueue = new Queue('notification-queue', { redis: env.REDIS });

    notificationQueue.process(async (job) => {
      const { user_id, title, message, type, reference_type, reference_id, action_url } = job.data;
      logger.debug(`Processing notification job for user: ${user_id}`);
      
      const notification = await notificationService.create({
        user_id, title, message, type, reference_type, reference_id, action_url
      });
      
      return notification;
    });

    notificationQueue.on('failed', (job, err) => {
      logger.error(`Notification job ${job.id} failed:`, err);
    });

    // 🔥 PREVENT CRASH IF REDIS IS DOWN
    notificationQueue.on('error', (err) => {
      logger.warn('Notification Queue Redis error:', err.message);
    });
  }
} catch (err) {
  logger.warn('Failed to initialized notification queue, running without Redis');
}

module.exports = notificationQueue;
