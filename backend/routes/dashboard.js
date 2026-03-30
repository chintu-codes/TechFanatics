const express = require('express');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET admin dashboard stats
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalDealers,
      totalLeads,
      newLeads,
      convertedLeads,
      totalOrders,
      pendingOrders,
      openTickets,
      recentLeads,
      recentOrders
    ] = await Promise.all([
      collections.users().countDocuments({ role: 'dealer' }),
      collections.leads().countDocuments(),
      collections.leads().countDocuments({ status: 'New' }),
      collections.leads().countDocuments({ status: 'Converted' }),
      collections.orders().countDocuments(),
      collections.orders().countDocuments({ status: 'Pending' }),
      collections.tickets().countDocuments({ status: 'Open' }),
      collections.leads().find().sort({ createdAt: -1 }).limit(5).toArray(),
      collections.orders().find().sort({ createdAt: -1 }).limit(5).toArray(),
    ]);

    // Total revenue from all completed orders
    const revenueAgg = await collections.orders().aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Outstanding balance across all dealers
    const outstandingAgg = await collections.users().aggregate([
      { $match: { role: 'dealer' } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } }
    ]).toArray();
    const totalOutstanding = outstandingAgg[0]?.total || 0;

    // Lead status breakdown
    const leadStatusBreakdown = await collections.leads().aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    res.json({
      stats: { totalDealers, totalLeads, newLeads, convertedLeads, totalOrders, pendingOrders, openTickets, totalRevenue, totalOutstanding },
      leadStatusBreakdown,
      recentLeads,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET dealer dashboard stats
router.get('/dealer', protect, async (req, res) => {
  try {
    const dealerId = new ObjectId(req.user._id);
    const [
      myLeads,
      convertedLeads,
      myOrders,
      pendingOrders,
      openTickets
    ] = await Promise.all([
      collections.leads().countDocuments({ assignedDealer: dealerId }),
      collections.leads().countDocuments({ assignedDealer: dealerId, status: 'Converted' }),
      collections.orders().countDocuments({ dealer: dealerId }),
      collections.orders().countDocuments({ dealer: dealerId, status: 'Pending' }),
      collections.tickets().countDocuments({ dealer: dealerId, status: 'Open' }),
    ]);

    const dealer = await collections.users().findOne(
      { _id: dealerId },
      { projection: { outstandingBalance: 1, name: 1, companyName: 1 } }
    );

    const recentLeads = await collections.leads()
      .find({ assignedDealer: dealerId })
      .sort({ createdAt: -1 }).limit(5).toArray();

    const recentOrders = await collections.orders()
      .find({ dealer: dealerId })
      .sort({ createdAt: -1 }).limit(5).toArray();

    res.json({
      stats: {
        myLeads, convertedLeads, myOrders, pendingOrders,
        openTickets, outstandingBalance: dealer?.outstandingBalance || 0
      },
      recentLeads,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
