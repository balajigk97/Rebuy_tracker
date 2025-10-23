'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardClient({ role, name }: { role?: string; name?: string }) {
  const router = useRouter();
  const { addPlayer, getPlayerByName } = useGame();

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

  // Fallback while redirecting
  return null;
}
