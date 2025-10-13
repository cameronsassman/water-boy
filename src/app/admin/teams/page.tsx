// app/admin/teams/page.tsx
"use client"

import ProtectedRoute from '@/components/admin/protected-route';
import TeamRegistration from '@/components/admin/team-registration';

export default function TeamsPage() {
  return (
    <ProtectedRoute>
      <TeamRegistration />
    </ProtectedRoute>
  );
}