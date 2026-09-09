import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/common/PublicOnlyRoute.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import EditTransaction from './pages/EditTransaction.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import Groups from './pages/Groups.jsx';
import GroupDetails from './pages/GroupDetails.jsx';
import AddGroupExpense from './pages/AddGroupExpense.jsx';
import Settlements from './pages/Settlements.jsx';
import Budgets from './pages/Budgets.jsx';
import Profile from './pages/Profile.jsx';
import SystemStatus from './pages/SystemStatus.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Routes (ARCHITECTURE.md §4.1).
 *
 * Pages appear here as they become genuinely functional. Budgets, receipts
 * and AI insights arrive in Phase 9 (IDEA.md §32.7).
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/status" element={<SystemStatus />} />

          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/new" element={<AddTransaction />} />
              <Route path="/transactions/:id/edit" element={<EditTransaction />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<GroupDetails />} />
              <Route path="/groups/:groupId/expenses/new" element={<AddGroupExpense />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
