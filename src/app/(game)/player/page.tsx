'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { createPlayer, players, isLoading } = useGame();
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
