const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Rental', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('reserved', 'picked_up', 'returned'),
    allowNull: false,
    defaultValue: 'reserved',
  },
  pickupDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  returnedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});
