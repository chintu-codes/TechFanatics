const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
let client;

const connectDB = async () => {
  if (db) return db;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(); // uses DB name from URI
    console.log('✅ MongoDB connected (native driver)');
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error('Database not initialized. Call connectDB() first.');
  return db;
};

// Collection helpers
const collections = {
  users: () => getDB().collection('users'),
  leads: () => getDB().collection('leads'),
  orders: () => getDB().collection('orders'),
  payments: () => getDB().collection('payments'),
  tickets: () => getDB().collection('tickets'),
  schemes: () => getDB().collection('schemes'),
};

module.exports = { connectDB, getDB, collections };
