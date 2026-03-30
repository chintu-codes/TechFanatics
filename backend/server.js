const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./db/connection');

const authRoutes = require('./routes/auth');
const dealerRoutes = require('./routes/dealers');
const leadRoutes = require('./routes/leads');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');
const schemeRoutes = require('./routes/schemes');
const salesRoutes = require('./routes/sales');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/sales', salesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Techfanatics CRM API running' }));

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();
module.exports = app;
