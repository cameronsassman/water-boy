// components/admin/protected-route.tsx
"use client";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "./Login";

interface Props {
  children: ReactNode;
  /** "super_admin" — only the super admin role may enter.
   *  "any" — either super_admin or scorer may enter (super admin can do everything). */
  require: "super_admin" | "any";
  area?: string;
}

export default function ProtectedRoute({ children, require, area }: Props) {
  const { role, logout } = useAuth();

  if (!role) return <LoginForm area={area} />;

  const allowed = require === "any" ? true : role === "super_admin";
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-3xl mb-3">🚫</div>
          <div className="font-bold text-lg text-gray-900 mb-1">Not authorized</div>
          <p className="text-sm text-gray-500 mb-5">Your scorer password doesn't have access to this area. You need the admin password instead.</p>
          <button onClick={logout} className="text-sm font-semibold text-blue-600 hover:underline">Log out and try a different password</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}