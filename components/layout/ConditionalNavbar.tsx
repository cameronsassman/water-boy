"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const HIDDEN_PREFIXES = ["/admin", "/scorer"];

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (hidden) return null;
  return <Navbar />;
}