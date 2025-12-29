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
    isReady: boolean;
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

            try {
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

                await setDoc(playerRef, newPlayer, { merge: false });

                toast({
                    title: 'Player Added',
                    description: `${name} has joined the game.`,
                });
            } catch (err) {
                console.error('Error creating player:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: `players/${normalizeName(name)}`,
                        operation: 'create',
                        requestResourceData: { name },
                    })
                );
            }
        },
        [firestore, playersColRef, toast]
    );

    const deletePlayer = useCallback(
        async (id: string) => {
            if (!firestore) return;

            try {
                const player = players.find(p => p.id === id);
                await deleteDoc(doc(firestore, 'players', id));

                if (player) {
                    toast({
                        title: 'Player Removed',
                        description: `${player.name} has been removed from the game.`,
                    });
                }
            } catch (err) {
                console.error('Error deleting player:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'delete',
                    })
                );
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
            console.error('Error deleting all players:', err);
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

            try {
                const player = players.find(p => p.id === id);
                const playerRef = doc(firestore, 'players', id);
                const updateData = { rebuyTimestamps: arrayUnion(Timestamp.now()) };

                await updateDoc(playerRef, updateData);

                if (player) {
                    toast({
                        title: 'Rebuy Confirmed',
                        description: `A rebuy was added for ${player.name}.`,
                    });
                }
            } catch (err) {
                console.error('Error adding rebuy:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'update',
                        requestResourceData: { rebuyTimestamps: 'arrayUnion' }
                    })
                );
            }
        },
        [firestore, players, toast]
    );

    const removeRebuy = useCallback(
        async (id: string) => {
            if (!firestore) return;

            try {
                const player = players.find(p => p.id === id);
                if (!player || player.rebuyTimestamps.length <= 1) return;

                const updatedTimestamps = [...player.rebuyTimestamps]
                    .sort((a, b) => a.toMillis() - b.toMillis())
                    .slice(0, -1);

                const playerRef = doc(firestore, 'players', id);
                const updateData = { rebuyTimestamps: updatedTimestamps };

                await updateDoc(playerRef, updateData);

                toast({
                    title: 'Last Buy-in Removed',
                    description: `The last buy-in for ${player.name} has been removed.`,
                    variant: 'destructive'
                });
            } catch (err) {
                console.error('Error removing rebuy:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'update',
                        requestResourceData: { rebuyTimestamps: 'array' }
                    })
                );
            }
        },
        [firestore, players, toast]
    );

    const updateBlackCoins = useCallback(
        async (id: string, count: number) => {
            if (!firestore || count < 0 || isNaN(count)) return;

            try {
                const playerRef = doc(firestore, 'players', id);
                const updateData = { blackCoins: count };

                await updateDoc(playerRef, updateData);
            } catch (err) {
                console.error('Error updating black coins:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'update',
                        requestResourceData: { blackCoins: count }
                    })
                );
            }
        },
        [firestore]
    );

    const requestRebuy = useCallback(
        async (id: string) => {
            if (!firestore) return;

            try {
                const playerRef = doc(firestore, 'players', id);
                const updateData = { hasPendingRebuyRequest: true };

                await updateDoc(playerRef, updateData);

                toast({
                    title: 'Request Sent',
                    description: 'Your rebuy request has been sent to the dealer for approval.',
                });
            } catch (err) {
                console.error('Error requesting rebuy:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'update',
                        requestResourceData: { hasPendingRebuyRequest: true }
                    })
                );
            }
        },
        [firestore, toast]
    );

    const approveRebuy = useCallback(
        async (id: string) => {
            if (!firestore) return;

            try {
                const player = players.find(p => p.id === id);
                const playerRef = doc(firestore, 'players', id);
                const updateData = {
                    rebuyTimestamps: arrayUnion(Timestamp.now()),
                    hasPendingRebuyRequest: false,
                };

                await updateDoc(playerRef, updateData);

                if (player) {
                    toast({
                        title: 'Rebuy Approved',
                        description: `Rebuy for ${player.name} has been approved.`,
                    });
                }
            } catch (err) {
                console.error('Error approving rebuy:', err);
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: doc(firestore, 'players', id).path,
                        operation: 'update',
                        requestResourceData: { rebuyTimestamps: 'arrayUnion', hasPendingRebuyRequest: false }
                    })
                );
            }
        },
        [firestore, players, toast]
    );

    /* ---------- context ---------- */

    const value = useMemo<GameContextType>(
        () => ({
            players: players || [], // Ensure players is always an array
            isLoading: isAuthLoading || isPlayersLoading,
            isReady: !!playersColRef && !!user && !isAuthLoading,
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
            playersColRef,
            user,
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
