import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import DealerLayout from './layouts/DealerLayout';
import SalesLayout from './layouts/SalesLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLeads from './pages/admin/Leads';
import AdminDealers from './pages/admin/Dealers';
import AdminOrders from './pages/admin/Orders';
import AdminPayments from './pages/admin/Payments';
import AdminTickets from './pages/admin/Tickets';
import AdminSchemes from './pages/admin/Schemes';
import AdminWhatsApp from './pages/admin/WhatsApp';
import AdminSales from './pages/admin/SalesTeam';

import DealerDashboard from './pages/dealer/Dashboard';
import DealerLeads from './pages/dealer/Leads';
import DealerOrders from './pages/dealer/Orders';
import DealerLedger from './pages/dealer/Ledger';
import DealerTickets from './pages/dealer/Tickets';
import DealerSchemes from './pages/dealer/Schemes';

import SalesDashboard from './pages/sales/Dashboard';

import ProtectedRoute from './context/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark-toast',
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="dealers" element={<AdminDealers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="schemes" element={<AdminSchemes />} />
              <Route path="whatsapp" element={<AdminWhatsApp />} />
              <Route path="sales" element={<AdminSales />} />
            </Route>

            {/* Dealer Routes */}
            <Route path="/dealer" element={<ProtectedRoute role="dealer"><DealerLayout /></ProtectedRoute>}>
              <Route index element={<DealerDashboard />} />
              <Route path="leads" element={<DealerLeads />} />
              <Route path="orders" element={<DealerOrders />} />
              <Route path="ledger" element={<DealerLedger />} />
              <Route path="tickets" element={<DealerTickets />} />
              <Route path="schemes" element={<DealerSchemes />} />
            </Route>

            {/* Sales Rep Routes */}
            <Route path="/sales" element={<ProtectedRoute role="sales"><SalesLayout /></ProtectedRoute>}>
              <Route index element={<SalesDashboard />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
