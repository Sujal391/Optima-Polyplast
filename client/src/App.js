import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faEdit,faTrashCan } from "@fortawesome/free-solid-svg-icons";

// Layout components
import AuthLayout from './components/layout/AuthLayout';
import PrivateRoute from './components/layout/PrivateRoute';

// Auth components
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';

// Admin Panel Components
import AdminDashboard from './components/admin/Dashboard';
import AdminMarketing from './components/admin/Marketing';
import UploadBanner from './components/admin/UploadBanner';
import UserList from './components/admin/UserList';
import CreateUser from './components/admin/CreateUser';
import TotalUser from './components/reception/TotalUser';
import OrderList from './components/admin/OrderList';
import RawMaterialSummary from './components/admin/RawMaterialSummary';
import CategoryManagement from './components/admin/CategoryManagement';
import FormulaManagement from './components/admin/FormulaManagement';
import ReportsExport from './components/admin/ReportsExport';
import PaymentReport from './components/admin/PaymentReport';
import PaymentHistoryReport from './components/admin/reports/PaymentHistoryReport';
import FilteredOrdersReport from './components/admin/reports/FilteredOrdersReport';
import ChallanReport from './components/admin/reports/ChallanReport';
import StockActivityReport from './components/admin/reports/StockActivityReport';

// Reception Panel Components
import ReceptionDashboard from './components/reception/Dashboard';
import CreateOrder from './components/reception/CreateOrder';
import PendingOrder from './components/reception/PendingOrder';
import TotalOrder from './components/reception/TotalOrder';
import ReceptionPendingPayment from './components/reception/PendingPayment';
import ReceptionPartialPayment from './components/reception/PartialPayment';

// Dispatch Panel Components
import DispatchDashboard from './components/dispatch/Dashboard';
import DispatchList from './components/dispatch/DispatchList';
import DispatchHistory from './components/dispatch/DispatchHistory';
import ChallanHistory from './components/dispatch/ChallanHistory';

// Stock Panel Components
import StockDashboard from './components/stock/Dashboard';
import StockList from './components/admin/StockList';
import AddStock from './components/stock/Stock';
import RawMaterial from './components/stock/RawMaterial';
import Labels from './components/stock/Labels';
import Caps from './components/stock/Caps';
import PreformTypes from './components/stock/PreformTypes';
import Production from './components/stock/Production/Production';
import Outcome from './components/stock/Outcome';
import Wastage from './components/stock/Wastage';
import DirectUsage from './components/stock/Production/DirectUsage';
import Reports from './components/stock/Report/Reports';

// Sales Panel Components
import SalesDashboard from './components/sales/Dashboard';
import SalesOrders from './components/sales/SalesOrders';

// Shared Components
import ProductList from './components/admin/ProductList';

library.add(faEdit, faTrashCan);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />

        {/* Admin Panel Routes */}
        <Route path="/admin/dashboard" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <AdminDashboard />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/users" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <UserList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/orders" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <OrderList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/PaymentReport" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <PaymentReport />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/createUser" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <CreateUser />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/upload-banner" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <UploadBanner />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/categories" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <CategoryManagement />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/formulas" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <FormulaManagement />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/export-reports" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <ReportsExport />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/admin/payments/history" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <PaymentHistoryReport />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/admin/orders/filter" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <FilteredOrdersReport />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/admin/challans" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <ChallanReport />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/admin/stock/activities" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <StockActivityReport />
            </AuthLayout>
          </PrivateRoute>
        }/>

        {/* Reception Panel Routes */}
        <Route path="/reception/dashboard" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/total-users" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <TotalUser />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/total-orders" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <TotalOrder />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/create-order" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <CreateOrder />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/pending-orders" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <PendingOrder />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/reception/pending-payments" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <ReceptionPendingPayment />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/reception/partial-payments" element={
          <PrivateRoute allowedRoles={['reception']}>
            <AuthLayout>
              <ReceptionDashboard />
              <ReceptionPartialPayment />
            </AuthLayout>
          </PrivateRoute>
        }/>

        {/* Stock Panel Routes */}
        <Route path="/stock/dashboard" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/Add-Stocks" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <AddStock />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/bottles-caps" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <AddStock />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/raw-material" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <RawMaterial />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/labels" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Labels />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/caps" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Caps />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/preform-types" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <PreformTypes />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/production" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Production />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/outcome" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Outcome />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/wastage" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Wastage />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/direct-usage" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <DirectUsage />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock/reports" element={
          <PrivateRoute allowedRoles={['stock']}>
            <AuthLayout>
              <StockDashboard />
              <Reports />
            </AuthLayout>
          </PrivateRoute>
        }/>

        {/* Dispatch Panel Routes */}
        <Route path="/dispatch/dashboard" element={
          <PrivateRoute allowedRoles={['dispatch']}>
            <AuthLayout>
              <DispatchDashboard />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/dispatch/processing-orders" element={
          <PrivateRoute allowedRoles={['dispatch']}>
            <AuthLayout>
              <DispatchDashboard />
              <DispatchList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/dispatch/dispatch-history" element={
          <PrivateRoute allowedRoles={['dispatch']}>
            <AuthLayout>
              <DispatchDashboard />
              <DispatchHistory />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/dispatch/challan-history" element={
          <PrivateRoute allowedRoles={['dispatch']}>
            <AuthLayout>
              <DispatchDashboard />
              <ChallanHistory />
            </AuthLayout>
          </PrivateRoute>
        }/>

        {/* Sales Panel Routes */}
        <Route path="/sales/dashboard" element={
          <PrivateRoute allowedRoles={['sales']}>
            <AuthLayout>
              <SalesDashboard />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/sales/orders" element={
          <PrivateRoute allowedRoles={['sales']}>
            <AuthLayout>
              <SalesDashboard />
              <SalesOrders />
            </AuthLayout>
          </PrivateRoute>
        }/>

        {/* Shared Routes with Role Restrictions */}
        <Route path="/order" element={
          <PrivateRoute allowedRoles={['admin', 'reception']}>
            <AuthLayout>
              <OrderList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/product" element={
          <PrivateRoute allowedRoles={['admin', 'stock']}>
            <AuthLayout>
              <ProductList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/stock" element={
          <PrivateRoute allowedRoles={['admin', 'stock']}>
            <AuthLayout>
              <StockList />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/raw-material-summary" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AuthLayout>
              <RawMaterialSummary />
            </AuthLayout>
          </PrivateRoute>
        }/>
        <Route path="/marketing" element={
          <PrivateRoute allowedRoles={['admin', 'marketing']}>
            <AuthLayout>
              <AdminMarketing />
            </AuthLayout>
          </PrivateRoute>
        }/>
      </Routes>
    </Router>
  );
}

export default App;