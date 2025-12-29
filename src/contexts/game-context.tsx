'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  collection,
  doc,
  Timestamp,
  arrayUnion,
  writeBatch,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import {
  useFirebase,
  useCollection,
  initiateAnonymousSignIn,
  useUser,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface GameContextType {
  players: Player[];
  isLoading: boolean;
  createPlayer: (name: string) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  deleteAllPlayers: () => Promise<void>;
  addRebuy: (id: string) => Promise<void>;
  removeRebuy: (id: string) => Promise<void>;
  updateBlackCoins: (id: string, count: number) => Promise<void>;
  requestRebuy: (id: string) => Promise<void>;
  approveRebuy: (id: string) => Promise<void>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

/* ------------------ helpers ------------------ */

const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, ' ');

/* ------------------ provider ------------------ */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { firestore, auth, user, isUserLoading: isAuthLoading } = useFirebase();
  const { toast } = useToast();

  /* ---------- auth init (strict-mode safe) ---------- */
  const didInitAuth = useRef(false);

  useEffect(() => {
    // Prevent re-running the effect.
    if (didInitAuth.current) return;
    
    // Only run if auth is initialized, there is no user, and it's not currently loading.
    if (auth && firestore && !user && !isAuthLoading) {
      didInitAuth.current = true;
      initiateAnonymousSignIn(auth);
    }
  }, [auth, firestore, user, isAuthLoading]);

  /* ---------- collection ---------- */
  const playersColRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(
      firestore,
      'players'
    ) as CollectionReference<Omit<Player, 'id'>>;
  }, [firestore, user]);

  const { data: players = [], isLoading: isPlayersLoading } =
    useCollection<Player>(playersColRef);

  /* ---------- core actions ---------- */

  const createPlayer = useCallback(
    async (name: string) => {
      if (!firestore || !playersColRef || !name) return;
  
        const normalized = normalizeName(name);
        const playerRef = doc(playersColRef, normalized);
    
        const playerDoc = await getDoc(playerRef);

        if (playerDoc.exists()) {
            return;
        }

        const now = Timestamp.now();
        const newPlayer: Omit<Player, 'id'> = {
            name,
            rebuyTimestamps: [now],
            blackCoins: 0,
            createdAt: now,
            hasPendingRebuyRequest: false,
        };
  
        setDoc(playerRef, newPlayer, { merge: false }).catch(err => {
            errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'create',
                requestResourceData: newPlayer,
            })
            );
        });
    
        toast({
        title: 'Player Added',
        description: `${name} has joined the game.`,
        });
    },
    [firestore, playersColRef, toast]
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const player = players.find(p => p.id === id);
      deleteDoc(doc(firestore, 'players', id)).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: doc(firestore, 'players', id).path,
                operation: 'delete',
            })
        );
      });
      if (player) {
        toast({
            title: 'Player Removed',
            description: `${player.name} has been removed from the game.`,
        });
      }
    },
    [firestore, players, toast]
  );

  const deleteAllPlayers = useCallback(async () => {
    if (!firestore || !playersColRef) return;

    try {
        const batch = writeBatch(firestore);
        const q = query(playersColRef);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            toast({
                title: 'No Players to Remove',
                description: 'The game table is already empty.',
            });
            return;
        }

        snapshot.docs.forEach(pDoc => {
            batch.delete(pDoc.ref);
        });

        await batch.commit();

        toast({
            title: 'Game Reset',
            description: 'All players have been removed from the table.',
            variant: 'destructive',
        });
    } catch (err) {
        console.error("Error deleting all players:", err);
        const permissionError = new FirestorePermissionError({
            path: playersColRef.path,
            operation: 'list', 
        });
        errorEmitter.emit('permission-error', permissionError);
    }
}, [firestore, playersColRef, toast]);

  const addRebuy = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const player = players.find(p => p.id === id);
      const playerRef = doc(firestore, 'players', id);
      const updateData = { rebuyTimestamps: arrayUnion(Timestamp.now()) };

      updateDoc(playerRef, updateData).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            })
        );
      });
      if (player) {
        toast({
          title: 'Rebuy Confirmed',
          description: `A rebuy was added for ${player.name}.`,
        });
      }
    },
    [firestore, players, toast]
  );

  const removeRebuy = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const player = players.find(p => p.id === id);
      if (!player || player.rebuyTimestamps.length <= 1) return;

      const updatedTimestamps = [...player.rebuyTimestamps]
        .sort((a, b) => a.toMillis() - b.toMillis())
        .slice(0, -1);
      
      const playerRef = doc(firestore, 'players', id);
      const updateData = { rebuyTimestamps: updatedTimestamps };

      updateDoc(playerRef, updateData).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            })
        );
      });

      toast({
        title: 'Last Buy-in Removed',
        description: `The last buy-in for ${player.name} has been removed.`,
        variant: 'destructive'
      });
    },
    [firestore, players, toast]
  );

  const updateBlackCoins = useCallback(
    async (id: string, count: number) => {
      if (!firestore || count < 0 || isNaN(count)) return;
      const playerRef = doc(firestore, 'players', id);
      const updateData = { blackCoins: count };

      updateDoc(playerRef, updateData).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            })
        );
      });
    },
    [firestore]
  );

  const requestRebuy = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const playerRef = doc(firestore, 'players', id);
      const updateData = { hasPendingRebuyRequest: true };

      updateDoc(playerRef, updateData).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            })
        );
      });
      toast({
        title: 'Request Sent',
        description: 'Your rebuy request has been sent to the dealer for approval.',
      });
    },
    [firestore, toast]
  );

  const approveRebuy = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const player = players.find(p => p.id === id);
      const playerRef = doc(firestore, 'players', id);
      const updateData = {
        rebuyTimestamps: arrayUnion(Timestamp.now()),
        hasPendingRebuyRequest: false,
      };

      updateDoc(playerRef, updateData).catch(err => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            })
        );
      });

       if (player) {
        toast({
            title: 'Rebuy Approved',
            description: `Rebuy for ${player.name} has been approved.`,
        });
    }
    },
    [firestore, players, toast]
  );

  /* ---------- context ---------- */

  const value = useMemo<GameContextType>(
    () => ({
      players: players || [], // Ensure players is always an array
      isLoading: isAuthLoading || isPlayersLoading,
      createPlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      requestRebuy,
      approveRebuy,
    }),
    [
      players,
      isAuthLoading,
      isPlayersLoading,
      createPlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      requestRebuy,
      approveRebuy,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/* ------------------ hook ------------------ */

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
