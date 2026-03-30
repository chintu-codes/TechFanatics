const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET all orders (admin sees all, dealer sees own)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (req.user.role === 'dealer') filter.dealer = new ObjectId(req.user._id);
    if (status) filter.status = status;

    const orders = await collections.orders().find(filter).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await collections.orders().findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'dealer' && order.dealer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create order (dealer)
router.post('/', protect, async (req, res) => {
  try {
    const { items, notes, leadId } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'Order items required' });

    const computedItems = items.map(item => ({
      productName: item.productName,
      sku: item.sku || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));

    const subtotal = computedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const discount = req.body.discount || 0;
    const tax = req.body.tax || 0;
    const totalAmount = subtotal - discount + tax;

    const now = new Date();
    const order = {
      orderNumber: 'ORD-' + Date.now(),
      dealer: new ObjectId(req.user._id),
      lead: leadId ? new ObjectId(leadId) : null,
      items: computedItems,
      subtotal, discount, tax, totalAmount,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      amountPaid: 0,
      outstandingAmount: totalAmount,
      notes: notes || '',
      createdAt: now, updatedAt: now
    };

    const result = await collections.orders().insertOne(order);

    // Update dealer outstanding balance
    await collections.users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { $inc: { outstandingBalance: totalAmount } }
    );

    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update order status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { $set: { status, updatedAt: new Date() } };
    if (status === 'Confirmed') {
      update.$set.approvedBy = new ObjectId(req.user._id);
      update.$set.approvedAt = new Date();
    }
    const result = await collections.orders().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      update,
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Order not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE order
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await collections.orders().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
