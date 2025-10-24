
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-1/4" />
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function DashboardClient({ role, name }: { role?: string; name?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addPlayer, getPlayerByName, isLoading: isGameLoading } = useGame();
  const { user, isUserLoading } = useUser();
  
  const currentRole = searchParams.get('role');
  const isLoading = isGameLoading || isUserLoading;

  useEffect(() => {
    // If loading, wait.
    if (isLoading) return;

    // If the role is dealer, but there's no authenticated user, redirect to login.
    if (currentRole === 'dealer' && !user) {
      router.replace('/');
      return;
    }

    // Handle Player joining
    if (currentRole === 'player') {
      const currentName = searchParams.get('name');
      if (currentName && !getPlayerByName(currentName)) {
        addPlayer(currentName);
      }
    }

  }, [isLoading, currentRole, user, router, addPlayer, getPlayerByName, searchParams]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Securely render the dealer view only if the user is authenticated
  if (currentRole === 'dealer' && user) {
    return <DealerView />;
  }

  if (currentRole === 'player' && name) {
    return <PlayerView playerName={name} />;
  }

  // Fallback for invalid states or while redirects are happening.
  return <DashboardSkeleton />;
}
