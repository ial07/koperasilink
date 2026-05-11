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
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/villages", label: "Villages", icon: Users },
  { href: "/dashboard/trend", label: "Trend Analysis", icon: BarChart3 },
  { href: "/dashboard/master-data/commodity", label: "Master Data", icon: Package },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-[280px] flex-col border-r bg-sidebar z-30">
      <div className="flex h-16 items-center px-6 border-b border-border/50 bg-sidebar/50 backdrop-blur-sm">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm group-hover:shadow-md transition-all">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-sidebar-foreground">
            Koperasi<span className="text-primary">Link</span>
          </span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Platform Overview
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
          <p className="font-semibold mb-1 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> AI Ready
          </p>
          <p className="opacity-90 text-xs">
            Predictive modeling is active for your region.
          </p>
        </div>
      </div>
    </aside>
  );
}
