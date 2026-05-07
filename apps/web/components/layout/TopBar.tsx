"use client";

import { Menu, Bell, User, Search, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/40 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div className="hidden md:flex relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search villages, commodities, or transactions..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user?.villageId && (
          <div className="hidden md:flex items-center gap-2 mr-4 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Village: {user.villageId.substring(0, 8)}</span>
          </div>
        )}
        
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-semibold">{user?.name || "Guest"}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{user?.role?.replace("_", " ") || "Member"}</span>
        </div>

        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
