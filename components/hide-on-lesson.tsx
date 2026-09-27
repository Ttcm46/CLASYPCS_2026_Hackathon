"use client";

import { usePathname } from "next/navigation";

export function HideOnLesson({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/caso")) return null;
  return children;
}
