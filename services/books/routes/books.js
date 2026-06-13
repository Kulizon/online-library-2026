const express = require('express');
const { Op } = require('sequelize');
const { Book } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const staffOnly = [authenticate, authorize('librarian', 'admin')];

function internalOnly(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!process.env.INTERNAL_API_KEY || key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeCopies(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeIsbn(value) {
  const raw = String(value || '').trim();
  const compact = raw.replace(/[-\s]/g, '').toUpperCase();
  const isbn13 = compact.replace(/\D/g, '');

  if (/^\d{9}[\dX]$/.test(compact)) return compact;
  if (/^(978|979)\d{10}$/.test(isbn13)) {
    return `${isbn13.slice(0, 3)}-${isbn13.slice(3, 5)}-${isbn13.slice(5, 9)}-${isbn13.slice(9, 12)}-${isbn13.slice(12)}`;
  }

  return null;
}

function normalizeEan(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  return /^\d{13}$/.test(raw) ? raw : null;
}

function eanFromIsbn(isbn) {
  const digits = String(isbn || '').replace(/\D/g, '');
  return /^\d{13}$/.test(digits) ? digits : null;
}

function isbnFromEan(ean) {
  return normalizeIsbn(ean);
}

// GET /api/books
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 10), 100);
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { author: { [Op.like]: `%${search}%` } },
            { isbn: { [Op.like]: `%${search}%` } },
            { ean: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await Book.findAndCountAll({
      where,
      order: [['title', 'ASC']],
      limit,
      offset,
    });

    res.json({
      books: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books/:id/reserve
router.post('/:id/reserve', internalOnly, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (book.availableCopies <= 0) {
      return res.status(409).json({ error: 'No copies available' });
    }

    await book.update({ availableCopies: book.availableCopies - 1 });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books/:id/release
router.post('/:id/release', internalOnly, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const availableCopies = Math.min(book.availableCopies + 1, book.totalCopies);
    await book.update({ availableCopies });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books
router.post('/', staffOnly, async (req, res) => {
  try {
    const { title, author, description = '' } = req.body;
    const providedEan = req.body.ean !== undefined && req.body.ean !== null && req.body.ean !== '';
    const normalizedEan = normalizeEan(req.body.ean);
    const isbn = normalizeIsbn(req.body.isbn) || isbnFromEan(normalizedEan);
    const ean = normalizedEan || eanFromIsbn(isbn);
    const totalCopies = normalizeCopies(req.body.totalCopies);

    if (!title || !author || !isbn || totalCopies === null) {
      return res.status(400).json({
        error: 'title, author, ISBN or EAN, and non-negative totalCopies are required',
      });
    }

    if (providedEan && !normalizedEan) {
      return res.status(400).json({ error: 'EAN must contain exactly 13 digits without dashes' });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      ean,
      description,
      totalCopies,
      availableCopies: totalCopies,
    });

    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'ISBN or EAN already in use' });
    }

    res.status(500).json({ error: err.message });
  }
});

// PUT /api/books/:id
router.put('/:id', staffOnly, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const nextTotalCopies = req.body.totalCopies === undefined
      ? book.totalCopies
      : normalizeCopies(req.body.totalCopies);
    const nextAvailableCopies = req.body.availableCopies === undefined
      ? book.availableCopies
      : normalizeCopies(req.body.availableCopies);

    if (nextTotalCopies === null || nextAvailableCopies === null) {
      return res.status(400).json({ error: 'Copies must be non-negative integers' });
    }

    const providedEan = req.body.ean !== undefined && req.body.ean !== null && req.body.ean !== '';
    const normalizedEan = normalizeEan(req.body.ean);
    const nextIsbn = req.body.isbn === undefined
      ? (book.isbn || isbnFromEan(normalizedEan))
      : (normalizeIsbn(req.body.isbn) || isbnFromEan(normalizedEan));
    const nextEan = req.body.ean === undefined
      ? (book.ean || eanFromIsbn(nextIsbn))
      : (normalizedEan || eanFromIsbn(nextIsbn));

    if (!nextIsbn) {
      return res.status(400).json({ error: 'ISBN must have 10 or 13 characters, or EAN must contain 13 digits' });
    }

    if (providedEan && !normalizedEan) {
      return res.status(400).json({ error: 'EAN must contain exactly 13 digits without dashes' });
    }

    await book.update({
      title: req.body.title ?? book.title,
      author: req.body.author ?? book.author,
      isbn: nextIsbn,
      ean: nextEan,
      description: req.body.description ?? book.description,
      totalCopies: nextTotalCopies,
      availableCopies: nextAvailableCopies,
    });

    res.json(book);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'ISBN or EAN already in use' });
    }

    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', staffOnly, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    await book.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/books/:id/stock
router.patch('/:id/stock', staffOnly, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const totalCopies = req.body.totalCopies === undefined
      ? book.totalCopies
      : normalizeCopies(req.body.totalCopies);
    const availableCopies = req.body.availableCopies === undefined
      ? book.availableCopies
      : normalizeCopies(req.body.availableCopies);

    if (totalCopies === null || availableCopies === null) {
      return res.status(400).json({ error: 'Copies must be non-negative integers' });
    }

    await book.update({ totalCopies, availableCopies });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
