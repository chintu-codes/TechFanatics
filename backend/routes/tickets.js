const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET tickets
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'dealer') filter.dealer = new ObjectId(req.user._id);
    const tickets = await collections.tickets().find(filter).sort({ createdAt: -1 }).toArray();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create ticket
router.post('/', protect, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'Subject and description required' });
    const now = new Date();
    const ticket = {
      ticketNumber: 'TKT-' + Date.now(),
      dealer: new ObjectId(req.user._id),
      dealerName: req.user.name,
      subject, description,
      category: category || 'Other',
      priority: priority || 'Medium',
      status: 'Open',
      replies: [],
      createdAt: now, updatedAt: now
    };
    const result = await collections.tickets().insertOne(ticket);
    res.status(201).json({ ...ticket, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update ticket status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { $set: { status, updatedAt: new Date() } };
    if (status === 'Resolved') update.$set.resolvedAt = new Date();
    const result = await collections.tickets().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) }, update, { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add reply to ticket
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    const reply = { message, sentBy: new ObjectId(req.user._id), sentByName: req.user.name, sentAt: new Date() };
    const result = await collections.tickets().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $push: { replies: reply }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
