const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');
const path = require('path');

const configuredDbPath = process.env.DB_PATH || 'auth.sqlite';
const storagePath = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.resolve(__dirname, '..', configuredDbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  dialectOptions: {
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  },
  logging: false,
});

const User = require('./User')(sequelize);

module.exports = { sequelize, User };
