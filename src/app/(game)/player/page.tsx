'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name');
  const { createPlayer, players, isLoading, tableInfo } = useGame();
  const didCreate = useRef(false);

  useEffect(() => {
    if (!name || isLoading || didCreate.current) return;
    const exists = players?.some(p => p.name === name);
    if (!exists) {
      didCreate.current = true;
      createPlayer(name);
    }
  }, [name, isLoading, players, createPlayer]);

  const player = players?.find(p => p.name === name);

  if (!name) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Player Name Missing</h2>
          <p className="text-muted-foreground mt-2">
            Please join as a player from the home page.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoading && !player && tableInfo?.isSettled) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div className="space-y-4">
          <ShieldX className="h-12 w-12 mx-auto text-destructive opacity-60" />
          <h2 className="text-2xl font-semibold">Game Has Ended</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            This game has been settled. New players cannot join.<br />
            Only existing players can view settlement results.
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !player) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Joining game...</h2>
          <p className="text-muted-foreground mt-2">
            Your stats will appear here shortly.
          </p>
        </div>
      </div>
    );
  }

  return <PlayerView playerName={name} />;
}


export default function PlayerPage() {
  return (
    // Suspense is required for pages that use `useSearchParams`.
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
