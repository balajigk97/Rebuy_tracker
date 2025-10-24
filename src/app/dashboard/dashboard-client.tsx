
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useUser, useAuth } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

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
  const auth = useAuth();
  
  const currentRole = role || searchParams.get('role');
  const currentName = name || searchParams.get('name');
  
  const isLoading = isGameLoading || isUserLoading;

  useEffect(() => {
    // If auth state is still loading, wait.
    if (isUserLoading) return;

    // If the role is dealer, but there's no authenticated user, initiate sign-in.
    if (currentRole === 'dealer' && !user) {
        const provider = new GoogleAuthProvider();
        signInWithRedirect(auth, provider);
        return; // signInWithRedirect will navigate away, so we can stop here.
    }

    // Handle Player joining
    if (currentRole === 'player') {
      if (currentName && !getPlayerByName(currentName)) {
        addPlayer(currentName);
      }
    }

  }, [isUserLoading, currentRole, user, auth, addPlayer, getPlayerByName, currentName]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Securely render the dealer view only if the user is authenticated and role is dealer
  if (currentRole === 'dealer' && user) {
    return <DealerView />;
  }

  if (currentRole === 'player' && currentName) {
    return <PlayerView playerName={currentName} />;
  }

  // Fallback for invalid states or while redirects are happening.
  return <DashboardSkeleton />;
}
