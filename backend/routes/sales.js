const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET all sales executives
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const salesTeam = await collections.users().find({ role: 'sales' }).sort({ createdAt: -1 }).toArray();
    res.json(salesTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a sales executive
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, target, isActive } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Required fields missing' });

    const existing = await collections.users().findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const newUser = {
      name, email: email.toLowerCase(), password: hashedPassword, phone,
      role: 'sales', target: Number(target) || 50, leadsConverted: 0,
      isActive: isActive !== false,
      createdAt: now, updatedAt: now
    };

    const result = await collections.users().insertOne(newUser);
    const { password: _, ...userSafe } = { ...newUser, _id: result.insertedId };
    res.status(201).json(userSafe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update sales executive
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, target, isActive } = req.body;
    const updateFields = { name, email, phone, target: Number(target), isActive, updatedAt: new Date() };
    
    if (password) {
      updateFields.password = await bcrypt.hash(password, 12);
    }

    const result = await collections.users().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE sales executive
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await collections.users().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Sales representative deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
