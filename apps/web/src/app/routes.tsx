import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

// Feature Pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { ToolDetailPage } from '../features/catalog/ToolDetailPage';
import { MyReservationsPage } from '../features/reservations/MyReservationsPage';
import { ReservationQueuePage } from '../features/reservations/ReservationQueuePage';
import { MyRentalsPage } from '../features/rentals/MyRentalsPage';
import { RentalDeskPage } from '../features/rentals/RentalDeskPage';
import { MyPaymentsPage } from '../features/payments/MyPaymentsPage';
import { PaymentVerificationPage } from '../features/payments/PaymentVerificationPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { MaintenancePage } from '../features/maintenance/MaintenancePage';
import { FeedbackPage } from '../features/feedback/FeedbackPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { UsersPage } from '../features/admin/UsersPage';
import { AuditLogPage } from '../features/admin/AuditLogPage';

export function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/catalog'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/catalog/:id" element={<ToolDetailPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />

      {/* Authenticated All Roles */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reservations"
        element={
          <ProtectedRoute>
            <MyReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rentals"
        element={
          <ProtectedRoute>
            <MyRentalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-payments"
        element={
          <ProtectedRoute>
            <MyPaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Staff and Administrator Routes */}
      <Route
        path="/staff/reservations"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <ReservationQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rentals"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <RentalDeskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/inventory"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/payments"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <PaymentVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/maintenance"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <MaintenancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/feedback"
        element={
          <ProtectedRoute allowedRoles={['Municipal Staff', 'Administrator']}>
            <FeedbackPage />
          </ProtectedRoute>
        }
      />

      {/* Administrator-Only Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

