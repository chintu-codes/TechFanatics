const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET all schemes
router.get('/', protect, async (req, res) => {
  try {
    const schemes = await collections.schemes().find({ isActive: true }).sort({ createdAt: -1 }).toArray();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create scheme (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, type, incentiveValue, incentiveType, minLeads, minSalesAmount, validFrom, validTo } = req.body;
    if (!title || !type || !incentiveValue || !validFrom || !validTo) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    const now = new Date();
    const scheme = {
      title, description, type, incentiveValue, incentiveType: incentiveType || 'Fixed',
      minLeads: minLeads || 0, minSalesAmount: minSalesAmount || 0,
      validFrom: new Date(validFrom), validTo: new Date(validTo),
      isActive: true,
      createdBy: new ObjectId(req.user._id),
      createdAt: now, updatedAt: now
    };
    const result = await collections.schemes().insertOne(scheme);
    res.status(201).json({ ...scheme, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update scheme
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, type, incentiveValue, incentiveType, minLeads, minSalesAmount, validFrom, validTo, isActive } = req.body;
    const result = await collections.schemes().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, description, type, incentiveValue, incentiveType, minLeads, minSalesAmount, validFrom: new Date(validFrom), validTo: new Date(validTo), isActive, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE scheme
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await collections.schemes().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Scheme deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
