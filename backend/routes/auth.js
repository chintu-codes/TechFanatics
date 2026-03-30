const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await collections.users().findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const { password: _, ...userSafe } = user;
    res.json({ token: generateToken(user._id.toString()), user: userSafe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register (admin seeds initial admin account)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, companyName, area, city, gstNumber } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Required fields missing' });

    const existing = await collections.users().findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const newUser = {
      name, email: email.toLowerCase(), password: hashedPassword, phone,
      role: role || 'dealer', companyName, area, city, gstNumber,
      outstandingBalance: 0, isActive: true,
      createdAt: now, updatedAt: now
    };

    const result = await collections.users().insertOne(newUser);
    const { password: _, ...userSafe } = { ...newUser, _id: result.insertedId };
    res.status(201).json({ token: generateToken(result.insertedId.toString()), user: userSafe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await collections.users().findOne({ _id: new ObjectId(decoded.id) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...userSafe } = user;
    res.json(userSafe);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
