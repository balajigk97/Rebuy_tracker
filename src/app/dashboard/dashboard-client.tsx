'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
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
  const router = useRouter();
  const { addPlayer, getPlayerByName } = useGame();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // Validate params
    if (!role || (role === 'player' && !name)) {
      router.push('/');
      return;
    }
    
    // Handle player joining
    if (role === 'player' && name) {
      const playerExists = getPlayerByName(name);
      if (!playerExists) {
        addPlayer(name);
      }
    }
  }, [role, name, router, addPlayer, getPlayerByName]);

  if (role === 'dealer') {
    return <DealerView />;
  }

  if (role === 'player' && name) {
    return <PlayerView playerName={name} />;
  }

  // Fallback while redirecting or for invalid states
  return <DashboardSkeleton />;
}
