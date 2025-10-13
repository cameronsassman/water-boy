// app/admin/scorecard/page.tsx
"use client"

import ProtectedRoute from '@/components/admin/protected-route';
import ScoreInput from '@/components/admin/score-input';

export default function ScorecardPage() {
  return (
    <ProtectedRoute>
      <ScoreInput />
    </ProtectedRoute>
  );
}