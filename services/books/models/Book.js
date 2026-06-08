const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    ean: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    totalCopies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    availableCopies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
  }, {
    validate: {
      availableDoesNotExceedTotal() {
        if (this.availableCopies > this.totalCopies) {
          throw new Error('availableCopies cannot exceed totalCopies');
        }
      },
    },
  });

  return Book;
};
