
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
import {
  useCollection,
  useFirebase,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (playerId: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const playersColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const { data: players, isLoading: isCollectionLoading } =
    useCollection<Player>(playersColRef);

  const isLoading = isUserLoading || isCollectionLoading;

  const addPlayer = useCallback(
    (name: string) => {
      if (!playersColRef) return;
      if (players?.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
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

      addDoc(playersColRef, newPlayer)
        .then(() => {
          toast({
            title: 'Player Joined',
            description: `${name} has joined the table with 1 buy-in.`,
          });
        })
        .catch(() => {
          const permissionError = new FirestorePermissionError({
            path: playersColRef.path,
            operation: 'create',
            requestResourceData: newPlayer,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    },
    [playersColRef, players, toast]
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
      if (!playersColRef) return;
      const player = players?.find((p) => p.id === playerId);
      if (!player) return;

      const playerDocRef = doc(playersColRef, playerId);
      deleteDocumentNonBlocking(playerDocRef);
      toast({
        title: 'Player Removed',
        description: `${player.name} has been removed from the table.`,
        variant: 'destructive',
      });
    },
    [playersColRef, players, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      if (!playersColRef) return;
      const player = players?.find((p) => p.id === playerId);
      if (!player) return;

      const playerDocRef = doc(playersColRef, playerId);
      const newRebuys = player.rebuys + 1;
      updateDocumentNonBlocking(playerDocRef, { rebuys: newRebuys });

      toast({
        title: 'Re-buy Added',
        description: `${player.name} has re-bought.`,
      });
    },
    [playersColRef, players, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
      if (!playersColRef) return;
      const player = players?.find((p) => p.id === playerId);
      if (!player) return;

      if (player.rebuys <= 1) {
        toast({
          title: 'Action Not Allowed',
          description: 'Cannot remove the initial buy-in.',
          variant: 'destructive',
        });
        return;
      }

      const playerDocRef = doc(playersColRef, playerId);
      const newRebuys = player.rebuys - 1;
      updateDocumentNonBlocking(playerDocRef, { rebuys: newRebuys });

      toast({
        title: 'Re-buy Removed',
        description: `A re-buy was removed for ${player.name}.`,
        variant: 'destructive',
      });
    },
    [playersColRef, players, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return players?.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const updateBlackCoins = useCallback(
    (playerId: string, count: number) => {
      if (!playersColRef) return;
      const validCount = count >= 0 ? count : 0;
      const playerDocRef = doc(playersColRef, playerId);
      updateDocumentNonBlocking(playerDocRef, { blackCoins: validCount });
    },
    [playersColRef]
  );

  const value = useMemo(
    () => ({
      players: players ?? [],
      isLoading,
      addPlayer,
      deletePlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      players,
      isLoading,
      addPlayer,
      deletePlayer,
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
