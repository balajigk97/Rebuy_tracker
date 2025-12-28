"use client";

import { FirebaseClientProvider } from "@/firebase";
import { GameProvider } from "@/contexts/game-context";
import { SyncStatusIndicator } from "./sync-status-indicator";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <GameProvider>
        {children}
        <SyncStatusIndicator />
      </GameProvider>
    </FirebaseClientProvider>
  );
}
