"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { isHydrated, accessToken } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.push("/login");
    }
  }, [isHydrated, accessToken, router]);

  if (!isHydrated || !accessToken) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
