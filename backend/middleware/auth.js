const jwt = require('jsonwebtoken');
const { collections } = require('../db/connection');
const { ObjectId } = require('mongodb');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await collections.users().findOne({ _id: new ObjectId(decoded.id) });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};

const adminOrSales = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'sales')) return next();
  return res.status(403).json({ message: 'Access denied.' });
};

module.exports = { protect, adminOnly, adminOrSales };
