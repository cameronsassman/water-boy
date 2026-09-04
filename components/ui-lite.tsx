// components/ui-lite.tsx
// Lightweight components matching shadcn/ui's visual language —
// no Radix, no extra packages, just Tailwind. Keep this file as the
// single source for these primitives rather than styling ad hoc.
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 border-b border-gray-100 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`font-semibold text-gray-900 flex items-center gap-2 ${className}`}>{children}</div>;
}
export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
} as const;
const buttonSizes = { default: "px-4 py-2 text-sm", sm: "px-3 py-1.5 text-xs" } as const;

export function Button({ variant = "default", size = "default", className = "", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes }) {
  return <button {...props} className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`} />;
}

const badgeVariants = {
  default: "bg-blue-100 text-blue-800",
  secondary: "bg-gray-100 text-gray-700",
  outline: "border border-gray-300 text-gray-600",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
} as const;
export function Badge({ variant = "default", className = "", children }:
  { variant?: keyof typeof badgeVariants; className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${badgeVariants[variant]} ${className}`}>{children}</span>;
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`block text-xs font-medium text-gray-600 mb-1 ${className}`} />;
}
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`} />;
}
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white ${className}`} />;
}