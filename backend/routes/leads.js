const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly, adminOrSales } = require('../middleware/auth');

const router = express.Router();

// GET leads — admin sees all, dealer sees only assigned
router.get('/', protect, async (req, res) => {
  try {
    const { status, area, search } = req.query;
    let filter = {};

    if (req.user.role === 'dealer') {
      filter.assignedDealer = new ObjectId(req.user._id);
    }
    if (status) filter.status = status;
    if (area) filter.area = { $regex: area, $options: 'i' };
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await collections.leads()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate assigned dealer name
    const dealerIds = [...new Set(leads.filter(l => l.assignedDealer).map(l => l.assignedDealer.toString()))];
    let dealerMap = {};
    if (dealerIds.length) {
      const dealers = await collections.users()
        .find({ _id: { $in: dealerIds.map(id => new ObjectId(id)) } }, { projection: { name: 1, companyName: 1, phone: 1 } })
        .toArray();
      dealers.forEach(d => { dealerMap[d._id.toString()] = d; });
    }

    const enriched = leads.map(l => ({
      ...l,
      assignedDealerInfo: l.assignedDealer ? dealerMap[l.assignedDealer.toString()] : null
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single lead
router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await collections.leads().findOne({ _id: new ObjectId(req.params.id) });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'dealer' && lead.assignedDealer?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create lead
router.post('/', protect, adminOrSales, async (req, res) => {
  try {
    const { customerName, phone, email, area, city, requirementDetails, productInterest, assignedDealer } = req.body;
    if (!customerName || !phone || !area) return res.status(400).json({ message: 'Name, phone, and area required' });

    const now = new Date();
    const lead = {
      customerName, phone, email, area, city, requirementDetails, productInterest,
      status: 'New',
      assignedDealer: assignedDealer ? new ObjectId(assignedDealer) : null,
      assignedBy: assignedDealer ? new ObjectId(req.user._id) : null,
      createdBy: new ObjectId(req.user._id),
      notes: [],
      followUpDate: null,
      convertedAt: null,
      createdAt: now, updatedAt: now
    };

    const result = await collections.leads().insertOne(lead);
    res.status(201).json({ ...lead, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update lead (status, notes, etc.)
router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await collections.leads().findOne({ _id: new ObjectId(req.params.id) });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role === 'dealer' && lead.assignedDealer?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { customerName, phone, email, area, city, requirementDetails, productInterest, status, followUpDate } = req.body;
    const updateFields = {
      customerName, phone, email, area, city, requirementDetails, productInterest,
      status, followUpDate: followUpDate ? new Date(followUpDate) : lead.followUpDate,
      updatedAt: new Date()
    };
    if (status === 'Converted' && lead.status !== 'Converted') {
      updateFields.convertedAt = new Date();
    }

    const result = await collections.leads().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT assign lead to dealer
router.put('/:id/assign', protect, adminOrSales, async (req, res) => {
  try {
    const { dealerId } = req.body;
    if (!dealerId) return res.status(400).json({ message: 'dealerId required' });

    const result = await collections.leads().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { assignedDealer: new ObjectId(dealerId), assignedBy: new ObjectId(req.user._id), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Lead not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add note to lead
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Note text required' });

    const note = { text, addedBy: new ObjectId(req.user._id), addedByName: req.user.name, addedAt: new Date() };
    const result = await collections.leads().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $push: { notes: note }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE lead
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await collections.leads().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
