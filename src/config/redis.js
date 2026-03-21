const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redis = null;

const connectRedis = () => {
  try {
    redis = new Redis({
      host: env.REDIS.host,
      port: env.REDIS.port,
      password: env.REDIS.password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.warn('Redis error:', err.message));

    return redis;
  } catch (err) {
    logger.warn('Redis not available:', err.message);
    return null;
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
