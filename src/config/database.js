const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB.name, env.DB.user, env.DB.password, {
  host: env.DB.host,
  port: env.DB.port,
  dialect: 'mysql',

  // Disable Sequelize SQL logs
  logging: false,

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize; 