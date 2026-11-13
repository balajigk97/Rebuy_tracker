'use client';

import { AppHeader } from '@/components/dashboard/app-header';
import { Suspense, useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameProvider } from '@/contexts/game-context';
import { useGame } from '@/contexts/game-context';

function GameLayoutContent({
  children,
  tableId,
}: {
  children: React.ReactNode;
  tableId?: string;
}) {
  const { user, isUserLoading } = useUser();
  const { isReady } = useGame();
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }

    if (!isUserLoading && !user && !isReady) {
      redirectTimer.current = setTimeout(() => {
        if (!user) router.replace('/');
      }, 3000);
    }

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [user, isUserLoading, isReady, router]);

  if (isUserLoading || (!user && !isReady)) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Connecting...</h2>
          <p className="text-muted-foreground mt-2">
            Loading your session details.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1">
      <Suspense>
        <AppHeader tableId={tableId} />
      </Suspense>
      <main className="flex-1 container mx-auto py-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}

function GameLayoutWithParams({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table') || undefined;

  return (
    <GameProvider tableId={tableId}>
      <div className="flex flex-col min-h-screen">
        <GameLayoutContent tableId={tableId}>{children}</GameLayoutContent>
      </div>
    </GameProvider>
  );
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <GameLayoutWithParams>{children}</GameLayoutWithParams>
    </Suspense>
  );
}
