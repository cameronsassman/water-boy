// app/admin/layout.tsx
"use client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

function AdminTopBar() {
  const { logout } = useAuth();
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0D1440] border-b border-[#1B3A6E]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A9CC8]">Super Admin</span>
      <button onClick={logout} className="text-[10px] font-bold uppercase tracking-widest text-[#7A9CC8] hover:text-white transition-colors">Log out</button>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute require="super_admin" area="the admin dashboard">
        <AdminTopBar />
        {children}
      </ProtectedRoute>
    </AuthProvider>
  );
}