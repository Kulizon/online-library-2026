const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');
const path = require('path');

const configuredDbPath = process.env.DB_PATH || 'rentals.sqlite';
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

const Rental = require('./Rental')(sequelize);

module.exports = { sequelize, Rental };
