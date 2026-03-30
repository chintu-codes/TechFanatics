// seed.js — Run: node seed.js
// Creates the default admin account and sample data

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/techfanatics_crm';

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  console.log('✅ Connected to MongoDB');

  const users = db.collection('users');

  // Clear existing
  await users.deleteMany({ role: { $in: ['admin', 'dealer'] } });

  const now = new Date();
  const adminPass = await bcrypt.hash('admin123', 12);
  const dealerPass = await bcrypt.hash('dealer123', 12);

  // Admin
  const adminResult = await users.insertOne({
    name: 'Super Admin',
    email: 'admin@techfanatics.com',
    password: adminPass,
    phone: '9999999999',
    role: 'admin',
    isActive: true,
    outstandingBalance: 0,
    createdAt: now, updatedAt: now
  });

  // Sample dealers
  const d1 = await users.insertOne({
    name: 'Rajesh Kumar',
    email: 'rajesh@dealer.com',
    password: dealerPass,
    phone: '9876543210',
    role: 'dealer',
    companyName: 'Kumar Equipments',
    area: 'Andheri',
    city: 'Mumbai',
    gstNumber: '27AABCU9603R1ZX',
    isActive: true,
    outstandingBalance: 15000,
    createdAt: now, updatedAt: now
  });

  const d2 = await users.insertOne({
    name: 'Priya Sharma',
    email: 'priya@dealer.com',
    password: dealerPass,
    phone: '9876501234',
    role: 'dealer',
    companyName: 'Sharma Tech Solutions',
    area: 'Bandra',
    city: 'Mumbai',
    isActive: true,
    outstandingBalance: 0,
    createdAt: now, updatedAt: now
  });

  // Sample leads
  const leads = db.collection('leads');
  await leads.insertMany([
    { customerName: 'Amit Shah', phone: '9811234567', area: 'Andheri', city: 'Mumbai', requirementDetails: 'Heavy drilling equipment for construction site', status: 'New', assignedDealer: d1.insertedId, createdBy: adminResult.insertedId, notes: [], createdAt: now, updatedAt: now },
    { customerName: 'Neha Patel', phone: '9822345678', area: 'Bandra', city: 'Mumbai', requirementDetails: 'Industrial generators — 50kVA', productInterest: 'Generator', status: 'Contacted', assignedDealer: d2.insertedId, createdBy: adminResult.insertedId, notes: [], createdAt: now, updatedAt: now },
    { customerName: 'Vikram Singh', phone: '9833456789', area: 'Andheri', city: 'Mumbai', requirementDetails: 'Compressors for factory use', status: 'Converted', assignedDealer: d1.insertedId, createdBy: adminResult.insertedId, notes: [], convertedAt: now, createdAt: now, updatedAt: now },
    { customerName: 'Sunita Desai', phone: '9844567890', area: 'Borivali', city: 'Mumbai', requirementDetails: 'Welding machines bulk order', status: 'New', assignedDealer: null, createdBy: adminResult.insertedId, notes: [], createdAt: now, updatedAt: now },
  ]);

  // Sample scheme
  const schemes = db.collection('schemes');
  await schemes.insertOne({
    title: 'Q1 Lead Conversion Bonus',
    description: 'Earn ₹500 for every lead converted this quarter',
    type: 'Lead-Based',
    incentiveValue: 500,
    incentiveType: 'Fixed',
    minLeads: 5,
    minSalesAmount: 0,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-03-31'),
    isActive: true,
    createdBy: adminResult.insertedId,
    createdAt: now, updatedAt: now
  });

  console.log('\n🎉 Seed data created successfully!\n');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│          Login Credentials               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ ADMIN                                    │');
  console.log('│  Email:    admin@techfanatics.com        │');
  console.log('│  Password: admin123                      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ DEALER 1                                 │');
  console.log('│  Email:    rajesh@dealer.com             │');
  console.log('│  Password: dealer123                     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ DEALER 2                                 │');
  console.log('│  Email:    priya@dealer.com              │');
  console.log('│  Password: dealer123                     │');
  console.log('└─────────────────────────────────────────┘');

  await client.close();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
