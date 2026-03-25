const Queue = require('bull');
const env = require('../config/env');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

const emailQueue = new Queue('email-queue', {
  redis: env.REDIS,
});

emailQueue.process(async (job) => {
  const { to, subject, text, html } = job.data;
  logger.debug(`Processing email job for: ${to}`);
  return await emailService.sendEmail(to, subject, text, html);
});

emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});

// 🔥 PREVENT CRASH IF REDIS IS DOWN
emailQueue.on('error', (err) => {
  logger.warn('Email Queue Redis error:', err.message);
});

module.exports = emailQueue;
