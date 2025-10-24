
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  );
}

export default function DashboardClient({ role: initialRole, name: initialName }: { role?: string; name?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addPlayer, getPlayerByName, isLoading: isGameLoading } = useGame();
  const { user, isLoading: isUserLoading, isAuthenticated } = useUser();
  
  const role = searchParams.get('role') || initialRole;
  const name = searchParams.get('name') || initialName;

  const isLoading = isUserLoading || isGameLoading;

  useEffect(() => {
    if (!isUserLoading && role === 'dealer' && !isAuthenticated) {
      // If trying to access dealer page without being logged in, redirect to home.
      router.push('/');
    }
  }, [isUserLoading, isAuthenticated, role, router]);

  useEffect(() => {
    if (role === 'player' && name) {
      if (!getPlayerByName(name)) {
        addPlayer(name);
      }
    }
  }, [role, name, addPlayer, getPlayerByName]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (role === 'dealer' && isAuthenticated) {
    return <DealerView />;
  }

  if (role === 'player' && name) {
    const player = getPlayerByName(name);
    return player ? <PlayerView playerName={name} /> : <DashboardSkeleton />;
  }
  
  // Fallback view if role is unclear or auth state is pending/invalid
  return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Welcome to the Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Select a role from the home page to get started.
        </p>
      </div>
  );
}
