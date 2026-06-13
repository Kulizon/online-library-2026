const express = require('express');
const { Rental } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { getNextBusinessDay } = require('../lib/pickupDate');
const { getBook, reserveBook, releaseBook } = require('../lib/bookClient');

const router = express.Router();
const clientOnly = [authenticate, authorize('client')];
const staffOnly = [authenticate, authorize('librarian', 'admin')];

function toPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function enrichRental(rental) {
  const book = await getBook(rental.bookId);
  return {
    ...rental.toJSON(),
    bookTitle: book?.title || null,
    bookAuthor: book?.author || null,
  };
}

router.post('/', clientOnly, async (req, res) => {
  try {
    const bookId = toPositiveInteger(req.body.bookId);
    if (!bookId) {
      return res.status(400).json({ error: 'Valid bookId is required' });
    }

    const book = await getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(409).json({ error: 'No copies available' });
    }

    const reserveResult = await reserveBook(bookId);
    if (!reserveResult.ok) {
      return res.status(reserveResult.status).json({ error: reserveResult.error });
    }

    try {
      const rental = await Rental.create({
        userId: req.user.id,
        bookId,
        status: 'reserved',
        pickupDate: getNextBusinessDay(),
      });

      res.status(201).json({
        id: rental.id,
        bookId: rental.bookId,
        status: rental.status,
        pickupDate: rental.pickupDate,
      });
    } catch (err) {
      await releaseBook(bookId);
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', clientOnly, async (req, res) => {
  try {
    const rentals = await Rental.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    const enriched = await Promise.all(rentals.map((rental) => enrichRental(rental)));
    res.json({ rentals: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', staffOnly, async (req, res) => {
  try {
    const rentals = await Rental.findAll({
      order: [['createdAt', 'DESC']],
    });

    const enriched = await Promise.all(rentals.map((rental) => enrichRental(rental)));
    res.json({ rentals: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/pickup', staffOnly, async (req, res) => {
  try {
    const rental = await Rental.findByPk(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    if (rental.status !== 'reserved') {
      return res.status(400).json({ error: 'Rental must be reserved before pickup' });
    }

    await rental.update({ status: 'picked_up' });
    res.json({
      id: rental.id,
      status: rental.status,
      pickupDate: rental.pickupDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/return', staffOnly, async (req, res) => {
  try {
    const rental = await Rental.findByPk(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    if (rental.status !== 'picked_up') {
      return res.status(400).json({ error: 'Rental must be picked up before return' });
    }

    const releaseResult = await releaseBook(rental.bookId);
    if (!releaseResult.ok) {
      return res.status(releaseResult.status).json({ error: releaseResult.error });
    }

    const returnedAt = new Date();
    await rental.update({ status: 'returned', returnedAt });

    res.json({
      id: rental.id,
      status: rental.status,
      returnedAt: rental.returnedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
