
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, UserCog, Moon, Sun, DollarSign } from "lucide-react";
import { useGame } from "@/contexts/game-context";
import { BUYIN_VALUE } from "@/lib/settlement";

const PLAYER_NAME_KEY = "poker_player_name";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function PotDisplay() {
  const { players } = useGame();
  const totalBuyIns = players.reduce((t, p) => t + (p.rebuyTimestamps?.length ?? 0), 0);
  const pot = totalBuyIns * BUYIN_VALUE;

  if (pot === 0) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-bold text-green-700 dark:text-green-400">
      <DollarSign className="h-3.5 w-3.5" />
      Pot: ${pot}
    </div>
  );
}

export function AppHeader({ tableId }: { tableId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { tableInfo } = useGame();
  const name = searchParams.get("name");
  const isDealer = pathname.includes('/dealer');

  const displayName = tableInfo?.displayName || tableId;

  const handleLeaveTable = () => {
    if (isDealer) {
      try { sessionStorage.removeItem('dealerAuthenticated'); } catch {}
    }
    router.push('/');
  };

  const handleLogOut = () => {
    if (name) {
      try { localStorage.removeItem(PLAYER_NAME_KEY); } catch {}
    }
    if (isDealer) {
      try { sessionStorage.removeItem('dealerAuthenticated'); } catch {}
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"></rect><path d="M215.4,85.1A32.4,32.4,0,0,0,192,80H151.2L128,42.6,104.8,80H64a32.4,32.4,0,0,0-23.4,5.1,31.5,31.5,0,0,0-5.5,45.2L88,213.3a8,8,0,0,0,14.4-4.2L86.2,160h83.6l-16.2,49.1a8,8,0,0,0,14.4,4.2l52.9-83A31.5,31.5,0,0,0,215.4,85.1Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12"></path></svg>
          <span className="text-xl font-bold font-headline hidden sm:inline">Rebuy Tracker</span>
          {displayName && (
            <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
              {displayName}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <PotDisplay />
          {isDealer && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <UserCog className="h-4 w-4" />
              <span>Dealer</span>
            </div>
          )}
          {name && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{name}</span>
            </div>
          )}
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLeaveTable}>
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Leave Table</span>
            <span className="sm:hidden">Leave</span>
          </Button>
          {name && (
            <Button variant="ghost" size="sm" onClick={handleLogOut} className="text-destructive hover:text-destructive">
              <span className="hidden sm:inline">Forget Me</span>
              <span className="sm:hidden text-xs">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
