const express = require('express');
const bcrypt = require('bcryptjs');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET all dealers (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const dealers = await collections.users()
      .find({ role: 'dealer' }, { projection: { password: 0 } })
      .toArray();
    res.json(dealers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single dealer
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const dealer = await collections.users().findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    res.json(dealer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create dealer (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, companyName, area, city, gstNumber } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Required fields missing' });

    const existing = await collections.users().findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const newDealer = {
      name, email: email.toLowerCase(), password: hashedPassword, phone,
      role: 'dealer', companyName, area, city, gstNumber,
      outstandingBalance: 0, isActive: true,
      createdAt: now, updatedAt: now
    };
    const result = await collections.users().insertOne(newDealer);
    const { password: _, ...safe } = { ...newDealer, _id: result.insertedId };
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update dealer
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, phone, companyName, area, city, gstNumber, isActive } = req.body;
    const update = { $set: { name, phone, companyName, area, city, gstNumber, isActive, updatedAt: new Date() } };
    const result = await collections.users().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      update,
      { returnDocument: 'after', projection: { password: 0 } }
    );
    if (!result) return res.status(404).json({ message: 'Dealer not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE dealer
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await collections.users().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Dealer removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
