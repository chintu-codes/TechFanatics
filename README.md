# 🏎️ Techfanatics Equipment Limited — Enterprise Dealer CRM & LMS

A powerful, full-stack **Dealer CRM and Lead Management System** custom-engineered for Techfanatics Equipment Limited. This platform streamlines lead-to-order lifecycles, automated financial ledgers, and incentive-driven dealer growth.

![Techfanatics Logo](C:\Users\OM\OneDrive\Desktop\TechFanatics\frontend\public\logo.png)

---

## 🌟 Software Characteristics
- **B2B Credit Ledger System:** Real-time synchronization between order placement and dealer outstanding balances.
- **Role-Based Access Control (RBAC):** Three distinct portals (Admin, Sales, Dealer) with strict data boundaries.
- **Mobile-First Dark Aesthetic:** Polished, premium glassmorphic UI designed for modern high-performance teams.
- **Automated Workflows:** Logic handlers for lead assignments, order status transitions, and support ticket threading.
- **Scalable Architecture:** Built with a high-performance native MongoDB driver and modular REST principles.

---

## 🛠️ Key Features Coverage

### 1. Admin Control Center (`/admin`)
- **Executive Dashboard:** Visual analytics for sales trends, lead conversion rates, and revenue distribution.
- **Dealer Management:** Complete lifecycle control (onboarding, edit, deactivate dealers).
- **Sales Team Module:** Manage internal sales staff, set performance targets, and monitor conversions.
- **WhatsApp Automation:** Bulk broadcast capability for payment reminders, lead alerts, and scheme announcements.
- **Support Command:** Centralized portal for handling multi-dealer support tickets.

### 2. Sales Executive Portal (`/sales`)
- **Performance Hub:** Dedicated view for sales personnel to monitor their specific team targets.
- **Lead Capture & Assignment:** Interface to register new prospects and assign them live to specific dealers.
- **Dealer Directory:** Read-only access to dealer profiles for coordination and logistics.

### 3. Dealer Management Portal (`/dealer`)
- **Lead Service Center:** View uniquely assigned leads, update engagement notes, and track statuses.
- **Smart Order Placement:** Multi-item cart system with automated tax (GST) and subtotal calculations.
- **Ledger & Real-time Clearing:** Full transaction history with **Razorpay integration** for instant online balance clearance.
- **Incentive Tracker:** Transparent view of corporate schemes, eligibility targets, and reward windows.

---

## 🔐 Portal Login Credentials

To gain access to the demonstration environments, use the following credentials (ensure `node seed.js` has been run):

| Portal Type | Role | Email | Password |
|-------------|------|-------|----------|
| **Admin Portal** | Admin | `admin@techfanatics.com` | `admin123` |
| **Sales Portal*** | Sales Rep | Create via Admin Panel | — |
| **Dealer Portal** | Dealer 1 | `rajesh@dealer.com` | `dealer123` |
| **Dealer Portal** | Dealer 2 | `priya@dealer.com` | `dealer123` |

> [!TIP]
> *To access the Sales Portal, log in as Admin, navigate to **Sales Team Module**, and create a representative. You can then log in with those custom credentials immediately.*

---

## 🚀 Deployment & Installation

### Environment Setup (`backend/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Quick Start Commands
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Seed default data (Run once)
cd ../backend && node seed.js

# 3. Launch Platform
cd .. && npm run dev
```

---

## 🔌 Integrated Services
- **Payment Gateway:** Razorpay (Standard API v1 Checkout)
- **Email/SMS Simulation:** Logic hooks for WhatsApp/Notification dispatch
- **Database Engine:** MongoDB Native Driver (Non-blocking I/O)

---
*Developed for Techfanatics Equipment Limited. Confidential Enterprise Distribution.*
