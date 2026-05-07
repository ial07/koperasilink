"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  Package,
  ArrowLeftRight,
  Lightbulb,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/villages", label: "Villages", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="font-bold text-lg">
          KoperasiLink
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
