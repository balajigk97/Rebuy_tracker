'use client';

import { useGame } from '@/contexts/game-context';
import { Users, X } from 'lucide-react';
import { Button } from '../ui/button';

interface PlayerCountToastProps {
  onDismiss: () => void;
}

export function PlayerCountToast({ onDismiss }: PlayerCountToastProps) {
  const { players } = useGame();
  const playerCount = players.length;

  if (playerCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg backdrop-blur-sm"
    >
      <Users className="h-4 w-4" />
      <span>
        {playerCount} {playerCount === 1 ? 'player' : 'players'}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="-mr-2 h-6 w-6 rounded-full text-destructive-foreground/70 hover:bg-destructive-foreground/20 hover:text-destructive-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
