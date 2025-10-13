// app/admin/page.tsx
"use client"

import ProtectedRoute from '@/components/admin/protected-route';
import AdminPortal from './admin-portal/page';

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPortal />
    </ProtectedRoute>
  );
}