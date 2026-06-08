const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { DataTypes } = require('sequelize');
const { sequelize, Book } = require('./models');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/books', bookRoutes);

async function ensureSchema() {
  await sequelize.sync();

  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('Books');

  if (!table.ean) {
    await queryInterface.addColumn('Books', 'ean', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex('Books');
  const hasEanIndex = indexes.some((index) => index.name === 'books_ean_unique');

  if (!hasEanIndex) {
    await queryInterface.addIndex('Books', ['ean'], {
      name: 'books_ean_unique',
      unique: true,
    });
  }

  const booksWithoutEan = await Book.findAll({ where: { ean: null } });
  for (const book of booksWithoutEan) {
    const derivedEan = String(book.isbn || '').replace(/\D/g, '');
    if (!/^\d{13}$/.test(derivedEan)) continue;

    const existing = await Book.findOne({ where: { ean: derivedEan } });
    if (!existing) {
      await book.update({ ean: derivedEan });
    }
  }

  const booksWithoutIsbn = await Book.findAll({ where: { isbn: null } });
  for (const book of booksWithoutIsbn) {
    const derivedIsbn = String(book.ean || '').replace(/\D/g, '');
    if (!/^(978|979)\d{10}$/.test(derivedIsbn)) continue;

    await book.update({
      isbn: `${derivedIsbn.slice(0, 3)}-${derivedIsbn.slice(3, 5)}-${derivedIsbn.slice(5, 9)}-${derivedIsbn.slice(9, 12)}-${derivedIsbn.slice(12)}`,
    });
  }
}

ensureSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`BookService running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start BookService:', error.message);
  process.exit(1);
});
