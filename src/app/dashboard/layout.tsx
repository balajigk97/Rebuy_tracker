
import { GameProvider } from "@/contexts/game-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { Suspense } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
        <GameProvider>
        <div className="flex flex-col min-h-screen">
            <Suspense>
            <AppHeader />
            </Suspense>
            <main className="flex-1 container mx-auto py-8">
            {children}
            </main>
        </div>
        </GameProvider>
    </FirebaseClientProvider>
  );
}
