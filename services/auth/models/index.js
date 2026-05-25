const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(process.env.DB_PATH || './auth.sqlite'),
  logging: false,
});

const User = require('./User')(sequelize);

module.exports = { sequelize, User };
