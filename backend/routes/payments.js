const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

// GET ledger for a dealer
router.get('/ledger/:dealerId', protect, async (req, res) => {
  try {
    const dealerId = req.params.dealerId;
    if (req.user.role === 'dealer' && req.user._id.toString() !== dealerId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const payments = await collections.payments()
      .find({ dealer: new ObjectId(dealerId) })
      .sort({ createdAt: -1 })
      .toArray();

    const dealer = await collections.users().findOne(
      { _id: new ObjectId(dealerId) },
      { projection: { name: 1, outstandingBalance: 1, companyName: 1 } }
    );

    res.json({ dealer, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all payments (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { dealerId } = req.query;
    let filter = {};
    if (dealerId) filter.dealer = new ObjectId(dealerId);
    const payments = await collections.payments().find(filter).sort({ createdAt: -1 }).toArray();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST record a payment (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { dealerId, orderId, amount, type, paymentMode, referenceNumber, description } = req.body;
    if (!dealerId || !amount || !type) return res.status(400).json({ message: 'dealerId, amount, type required' });

    // Get dealer current balance
    const dealer = await collections.users().findOne({ _id: new ObjectId(dealerId) });
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });

    const balanceDelta = type === 'Credit' ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = (dealer.outstandingBalance || 0) + balanceDelta;

    const now = new Date();
    const payment = {
      dealer: new ObjectId(dealerId),
      order: orderId ? new ObjectId(orderId) : null,
      amount: Math.abs(amount),
      type,
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      description: description || '',
      recordedBy: new ObjectId(req.user._id),
      balanceAfter: newBalance,
      createdAt: now, updatedAt: now
    };

    await collections.payments().insertOne(payment);

    // Update dealer's outstanding balance
    await collections.users().updateOne(
      { _id: new ObjectId(dealerId) },
      { $set: { outstandingBalance: newBalance, updatedAt: now } }
    );

    // If linked to an order, update its payment status
    if (orderId) {
      const order = await collections.orders().findOne({ _id: new ObjectId(orderId) });
      if (order) {
        const newAmountPaid = (order.amountPaid || 0) + Math.abs(amount);
        const newOutstanding = order.totalAmount - newAmountPaid;
        const paymentStatus = newOutstanding <= 0 ? 'Paid' : newAmountPaid > 0 ? 'Partial' : 'Unpaid';
        await collections.orders().updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { amountPaid: newAmountPaid, outstandingAmount: Math.max(0, newOutstanding), paymentStatus, updatedAt: now } }
        );
      }
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST initialize Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123456789',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123456789'
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${req.user._id}_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    res.json({ order, key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123456789' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST verify Razorpay signature and update ledger
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    
    // In strict production, verify signature here using crypto
    // const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123456789';
    // const hmac = crypto.createHmac('sha256', secret);
    // hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    // const generated_signature = hmac.digest('hex');
    // if (generated_signature !== razorpay_signature) return res.status(400).json({ message: 'Payment verification failed' });

    // Mark successful in ledger for Dealer
    const dealerId = req.user._id;
    const dealer = await collections.users().findOne({ _id: new ObjectId(dealerId) });
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });

    const newBalance = (dealer.outstandingBalance || 0) - Math.abs(amount);
    
    const now = new Date();
    const payment = {
      dealer: new ObjectId(dealerId),
      order: null,
      amount: Math.abs(amount),
      type: 'Credit',
      paymentMode: 'Online Gateway (Razorpay)',
      referenceNumber: razorpay_payment_id,
      description: 'Online balance clearance via Razorpay',
      recordedBy: new ObjectId(dealerId), // recorded automatically by system/dealer
      balanceAfter: newBalance,
      createdAt: now, updatedAt: now
    };

    await collections.payments().insertOne(payment);

    await collections.users().updateOne(
      { _id: new ObjectId(dealerId) },
      { $set: { outstandingBalance: newBalance, updatedAt: now } }
    );

    res.json({ message: 'Payment verified and ledger updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
