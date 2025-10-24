
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';

interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const PLAYERS_COLLECTION = 'players';

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const playersColRef = useMemoFirebase(
    () => collection(firestore, PLAYERS_COLLECTION),
    [firestore]
  );
  
  const { data: players = [], isLoading } = useCollection<Player>(playersColRef);

  const addPlayer = useCallback(
    (name: string) => {
      const existingPlayer = players.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existingPlayer) {
        toast({
          title: 'Player already exists',
          description: `${name} is already at the table.`,
          variant: 'destructive',
        });
        return;
      }

      const newPlayer: Omit<Player, 'id'> = {
        name,
        rebuys: 1,
        blackCoins: 0,
      };

      addDocumentNonBlocking(playersColRef, newPlayer);

      toast({
        title: 'Player Joined',
        description: `${name} has joined the table with 1 buy-in.`,
      });
    },
    [players, playersColRef, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      const playerDocRef = doc(firestore, PLAYERS_COLLECTION, playerId);
      updateDocumentNonBlocking(playerDocRef, { rebuys: player.rebuys + 1 });
      
      toast({
        title: 'Re-buy Added',
        description: `${player.name} has re-bought.`,
      });
    },
    [firestore, players, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      
      if (player.rebuys <= 1) {
        toast({
          title: 'Action Not Allowed',
          description: 'Cannot remove the initial buy-in.',
          variant: 'destructive',
        });
        return;
      }
      
      const playerDocRef = doc(firestore, PLAYERS_COLLECTION, playerId);
      updateDocumentNonBlocking(playerDocRef, { rebuys: player.rebuys - 1 });

      toast({
        title: 'Re-buy Removed',
        description: `A re-buy was removed for ${player.name}.`,
        variant: 'destructive',
      });
    },
    [firestore, players, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const updateBlackCoins = useCallback((playerId: string, count: number) => {
    const validCount = count >= 0 ? count : 0;
    const playerDocRef = doc(firestore, PLAYERS_COLLECTION, playerId);
    updateDocumentNonBlocking(playerDocRef, { blackCoins: validCount });
  }, [firestore]);

  const value = useMemo(
    () => ({
      players,
      isLoading,
      addPlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      players,
      isLoading,
      addPlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
