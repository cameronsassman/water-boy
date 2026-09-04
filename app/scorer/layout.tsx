// app/scorer/layout.tsx
"use client";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

function ScorerTopBar() {
  const { logout } = useAuth();
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0D1440] border-b border-[#1B3A6E]">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white">🏆 Scorer</span>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-[#7A9CC8] hover:text-white transition-colors">← Public site</Link>
      </div>
      <button onClick={logout} className="text-[10px] font-bold uppercase tracking-widest text-[#7A9CC8] hover:text-white transition-colors">Log out</button>
    </div>
  );
}

export default function ScorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute require="any" area="live scoring">
        <ScorerTopBar />
        {children}
      </ProtectedRoute>
    </AuthProvider>
  );
}