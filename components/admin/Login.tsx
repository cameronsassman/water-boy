// components/admin/login-form.tsx
"use client";
import { useState } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from "@/components/ui-lite";

export default function LoginForm({ area = "tournament controls" }: { area?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const matched: Role = login(password);
    if (matched) setPassword("");
    else setError("Invalid password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-3 text-3xl">🔒</div>
          <CardTitle className="justify-center text-xl">Admin Portal</CardTitle>
          <p className="text-center text-sm text-gray-500 mt-1">Enter your password to access {area}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2.5">
                ⚠ {error}
              </div>
            )}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}