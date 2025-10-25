"use client";

import { FirebaseClientProvider } from "@/firebase";
import { GameProvider } from "@/contexts/game-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </FirebaseClientProvider>
  );
}
