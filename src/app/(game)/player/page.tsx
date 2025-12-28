'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useEffect } from 'react';

// Force this page to be dynamically rendered, making it behave like the development environment.
export const dynamic = 'force-dynamic';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { findOrCreatePlayer, getPlayerByName, isLoading } = useGame();

  // This effect ensures the player is found or created when the page loads.
  useEffect(() => {
    if (name) {
      findOrCreatePlayer(name);
    }
  }, [name, findOrCreatePlayer]);

  const player = getPlayerByName(name || '');

  // If the page is loaded without a name, show an error.
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
  
  // Show a loading screen while the game data is loading from Firestore 
  // OR while we wait for the specific player to appear in the local state.
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
  
  // Once the player exists, render their view.
  return <PlayerView playerName={name} />;
}


export default function PlayerPage() {
  return (
    // Suspense is good practice for pages using searchParams
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
