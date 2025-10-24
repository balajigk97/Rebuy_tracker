
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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


export default function DashboardClient({ role: initialRole, name: initialName }: { role?: string; name?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addPlayer, getPlayerByName, isLoading: isGameLoading } = useGame();
  const { user, isUserLoading } = useUser();
  
  // Determine the effective role and name, prioritizing URL params
  const paramRole = searchParams.get('role');
  const paramName = searchParams.get('name');

  // Use a state to manage the role to prevent re-renders from causing loops
  const [effectiveRole, setEffectiveRole] = useState(paramRole || initialRole);

  const currentName = paramName || initialName;
  
  const isLoading = isGameLoading || isUserLoading;

  useEffect(() => {
    // If auth is loading, wait.
    if (isUserLoading) return;
    
    // Scenario: User has just logged in via redirect, but there's no role in the URL.
    // We can infer they are the dealer.
    if (!paramRole && user) {
        setEffectiveRole('dealer');
        // We can optionally clean up the URL here, but it's not strictly necessary.
        // router.replace('/dashboard?role=dealer', { scroll: false });
    }

    // Handle Player joining - this should only run once
    if (paramRole === 'player' && currentName) {
      if (!getPlayerByName(currentName)) {
        addPlayer(currentName);
      }
    }
  }, [user, isUserLoading, paramRole, currentName, addPlayer, getPlayerByName]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Render based on the determined role
  if (effectiveRole === 'dealer' && user) {
    return <DealerView />;
  }

  if (effectiveRole === 'player' && currentName) {
    const player = getPlayerByName(currentName);
    // Show skeleton if player is not yet in the game state
    return player ? <PlayerView playerName={currentName} /> : <DashboardSkeleton />;
  }
  
  // If the user is not logged in and trying to access dealer page, show skeleton
  if (effectiveRole === 'dealer' && !user) {
    return <DashboardSkeleton />;
  }


  // Fallback for invalid states or while redirects are happening.
  return <DashboardSkeleton />;
}
