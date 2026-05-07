"use client";

import { Menu, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon">
        <User className="h-5 w-5" />
      </Button>
    </header>
  );
}
