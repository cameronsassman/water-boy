// app/admin/fixtures/page.tsx
"use client"

import ProtectedRoute from '@/components/admin/protected-route';
import ManualFixtureEntry from '@/components/admin/fixtures-form';

export default function FixturesPage() {
  return (
    <ProtectedRoute>
      <ManualFixtureEntry />
    </ProtectedRoute>
  );
}