"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, UserRound } from "lucide-react";
import { BookMascot } from "@/components/book-mascot";
import { cn } from "@/lib/utils";

const links = [
  { href: "/inicio", label: "Aprender", icon: Home },
  { href: "/ranking", label: "Ligas", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/caso")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#D6DEEE] bg-white md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-extrabold uppercase tracking-wide",
                  active ? "text-[#C41E3A]" : "text-[#5B6B86]",
                )}
              >
                <link.icon className="size-6" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/caso")) return null;

  return (
    <nav className="hidden w-56 shrink-0 border-r-2 border-[#D6DEEE] bg-white px-4 py-6 md:block">
      <div className="mb-6 flex items-center gap-2 px-1">
        <BookMascot size={44} />
        <p className="text-lg font-extrabold tracking-tight text-[#1E4B8E]">
          Folio
        </p>
      </div>
      <ul className="space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                prefetch
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold uppercase tracking-wide",
                  active
                    ? "bg-[#FDE8EA] text-[#C41E3A] ring-2 ring-[#C41E3A]"
                    : "text-[#5B6B86] hover:bg-[#F7F9FC]",
                )}
              >
                <link.icon className="size-6" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
