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
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Player, Table, SettlementSnapshot } from '@/lib/types';
import { calculateSettlement, BUYIN_VALUE } from '@/lib/settlement';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface GameContextType {
    players: Player[];
    isLoading: boolean;
    isReady: boolean;
    tableInfo: Table | null;
    settlements: SettlementSnapshot[];
    createPlayer: (name: string) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    deleteAllPlayers: () => Promise<void>;
    addRebuy: (id: string) => Promise<void>;
    removeRebuy: (id: string) => Promise<void>;
    updateBlackCoins: (id: string, count: number) => Promise<void>;
    requestRebuy: (id: string) => Promise<void>;
    approveRebuy: (id: string) => Promise<void>;
    deleteTable: () => Promise<void>;
    setHost: (id: string) => Promise<void>;
    saveSettlement: () => Promise<void>;
    updateTableInfo: (data: Partial<Pick<Table, 'displayName' | 'pin'>>) => Promise<void>;
    loadSettlements: () => Promise<void>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, ' ');

interface GameProviderProps {
    children: React.ReactNode;
    tableId?: string;
}

export function GameProvider({ children, tableId }: GameProviderProps) {
    const { firestore, auth, user, isUserLoading: isAuthLoading } = useFirebase();
    const { toast } = useToast();
    const didInitAuth = useRef(false);
    const prevPendingRef = useRef<Set<string>>(new Set());
    const playersRef = useRef<Player[]>([]);
    const settlementsLoadedRef = useRef(false);

    useEffect(() => {
        if (didInitAuth.current) return;
        if (auth && firestore && !user && !isAuthLoading) {
            didInitAuth.current = true;
            initiateAnonymousSignIn(auth);
        }
    }, [auth, firestore, user, isAuthLoading]);

    useEffect(() => {
        if (!firestore || !tableId || !user) return;
        const registerTable = async () => {
            try {
                const tableRef = doc(firestore, 'tables', tableId);
                await setDoc(tableRef, {
                    id: tableId,
                    lastActive: Timestamp.now()
                }, { merge: true });
            } catch (err) {
                console.error("Error registering table:", err);
            }
        };
        registerTable();
    }, [firestore, tableId, user]);

    const [settlements, setSettlements] = React.useState<SettlementSnapshot[]>([]);

    const getStorageKey = useCallback(() => tableId ? `settlements_${tableId}` : null, [tableId]);

    const loadSettlements = useCallback(async () => {
        const key = getStorageKey();
        if (!key || settlementsLoadedRef.current) return;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw) as SettlementSnapshot[];
                data.sort((a, b) => (b.settledAt as any) - (a.settledAt as any));
                setSettlements(data);
            }
            settlementsLoadedRef.current = true;
        } catch {}
    }, [getStorageKey]);

    const [tableInfo, setTableInfo] = React.useState<Table | null>(null);
    const tableInfoFetched = useRef(false);
    useEffect(() => {
        if (!firestore || !tableId || !user || tableInfoFetched.current) return;
        tableInfoFetched.current = true;
        const fetchTableInfo = async () => {
            try {
                const snap = await getDoc(doc(firestore, 'tables', tableId));
                if (snap.exists()) {
                    setTableInfo({ id: snap.id, ...snap.data() } as Table);
                }
            } catch {}
        };
        fetchTableInfo();
    }, [firestore, tableId, user]);

    const playersColRef = useMemo(() => {
        if (!firestore || !user) return null;
        if (tableId) {
            return collection(
                firestore,
                'tables',
                tableId,
                'players'
            ) as CollectionReference<Omit<Player, 'id'>>;
        }
        return collection(
            firestore,
            'players'
        ) as CollectionReference<Omit<Player, 'id'>>;
    }, [firestore, user, tableId]);

    const { data: players = [], isLoading: isPlayersLoading } =
        useCollection<Player>(playersColRef);

    useEffect(() => {
        playersRef.current = players || [];
    }, [players]);

    // #8: Rebuy notification
    useEffect(() => {
        if (!players || players.length === 0) return;
        const currentPending = new Set(
            players.filter(p => p.hasPendingRebuyRequest).map(p => p.id)
        );
        const prev = prevPendingRef.current;
        const newRequests = [...currentPending].filter(id => !prev.has(id));

        if (newRequests.length > 0 && prev.size > 0) {
            const names = newRequests.map(id => players.find(p => p.id === id)?.name).filter(Boolean);
            if (names.length > 0) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Rebuy Request', {
                        body: `${names.join(', ')} requested a rebuy`,
                        icon: '/favicon.ico',
                    });
                }
                try {
                    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                } catch {}
            }
        }
        prevPendingRef.current = currentPending;
    }, [players]);

    const createPlayer = useCallback(
        async (name: string) => {
            if (!firestore || !playersColRef || !name) return;

            const normalized = normalizeName(name);

            if (playersRef.current.some(p => p.id === normalized)) return;

            try {
                const playerRef = doc(playersColRef, normalized);

                const playerDoc = await getDoc(playerRef);
                if (playerDoc.exists()) return;

                const now = Timestamp.now();
                const newPlayer: Omit<Player, 'id'> = {
                    name,
                    rebuyTimestamps: [now],
                    blackCoins: 0,
                    createdAt: now,
                    hasPendingRebuyRequest: false,
                    isHost: false,
                };

                await setDoc(playerRef, newPlayer, { merge: false });
                toast({ title: 'Player Added', description: `${name} has joined the game.` });
            } catch (err) {
                console.error('Error creating player:', err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `players/${normalized}`,
                    operation: 'create',
                    requestResourceData: { name },
                }));
            }
        },
        [firestore, playersColRef, toast]
    );

    const deletePlayer = useCallback(
        async (id: string) => {
            if (!firestore || !playersColRef) return;
            try {
                const player = playersRef.current.find(p => p.id === id);
                await deleteDoc(doc(playersColRef, id));
                if (player) {
                    toast({ title: 'Player Removed', description: `${player.name} has been removed from the game.` });
                }
            } catch (err) {
                console.error('Error deleting player:', err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: doc(playersColRef, id).path,
                    operation: 'delete',
                }));
            }
        },
        [firestore, playersColRef, toast]
    );

    const deleteAllPlayers = useCallback(async () => {
        if (!firestore || !playersColRef) return;
        try {
            const batch = writeBatch(firestore);
            const snapshot = await getDocs(query(playersColRef));
            if (snapshot.empty) {
                toast({ title: 'No Players to Remove', description: 'The game is already empty.' });
                return;
            }
            snapshot.docs.forEach(pDoc => batch.delete(pDoc.ref));
            await batch.commit();
            toast({ title: 'Game Reset', description: 'All players have been removed from the game.', variant: 'destructive' });
        } catch (err) {
            console.error('Error deleting all players:', err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: playersColRef.path, operation: 'list' }));
        }
    }, [firestore, playersColRef, toast]);

    const updatePlayerDoc = useCallback(async (id: string, updateData: any, operationName: string) => {
        if (!firestore || !playersColRef) return;
        const playerRef = doc(playersColRef, id);
        try {
            await updateDoc(playerRef, updateData);
        } catch (err) {
            console.error(`Error during ${operationName}:`, err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        }
    }, [firestore, playersColRef]);

    const addRebuy = useCallback(async (id: string) => {
        const player = playersRef.current.find(p => p.id === id);
        await updatePlayerDoc(id, { rebuyTimestamps: arrayUnion(Timestamp.now()) }, 'addRebuy');
        if (player) {
            toast({ title: 'Rebuy Confirmed', description: `A rebuy was added for ${player.name}.` });
        }
    }, [updatePlayerDoc, toast]);

    const removeRebuy = useCallback(async (id: string) => {
        const player = playersRef.current.find(p => p.id === id);
        if (!player || player.rebuyTimestamps.length <= 1) return;
        const updatedTimestamps = [...player.rebuyTimestamps].sort((a, b) => a.toMillis() - b.toMillis()).slice(0, -1);
        await updatePlayerDoc(id, { rebuyTimestamps: updatedTimestamps }, 'removeRebuy');
        toast({ title: 'Last Buy-in Removed', description: `The last buy-in for ${player.name} has been removed.`, variant: 'destructive' });
    }, [updatePlayerDoc, toast]);

    const updateBlackCoins = useCallback(async (id: string, count: number) => {
        if (isNaN(count) || count < 0) return;
        const rounded = parseFloat(count.toFixed(2));
        await updatePlayerDoc(id, { blackCoins: rounded }, 'updateBlackCoins');
    }, [updatePlayerDoc]);

    const requestRebuy = useCallback(async (id: string) => {
        await updatePlayerDoc(id, { hasPendingRebuyRequest: true }, 'requestRebuy');
        toast({ title: 'Request Sent', description: 'Your rebuy request has been sent to the dealer for approval.' });
    }, [updatePlayerDoc, toast]);

    const approveRebuy = useCallback(async (id: string) => {
        const player = playersRef.current.find(p => p.id === id);
        await updatePlayerDoc(id, {
            rebuyTimestamps: arrayUnion(Timestamp.now()),
            hasPendingRebuyRequest: false,
        }, 'approveRebuy');
        if (player) {
            toast({ title: 'Rebuy Approved', description: `Rebuy for ${player.name} has been approved.` });
        }
    }, [updatePlayerDoc, toast]);

    const setHost = useCallback(async (id: string) => {
        if (!firestore || !playersColRef) return;
        const batch = writeBatch(firestore);
        const currentPlayers = playersRef.current;
        for (const player of currentPlayers) {
            const ref = doc(playersColRef, player.id);
            batch.update(ref, { isHost: player.id === id });
        }
        try {
            await batch.commit();
            const player = currentPlayers.find(p => p.id === id);
            if (player) {
                toast({ title: 'Host Updated', description: `${player.name} is now the host.` });
            }
        } catch (err) {
            console.error('Error setting host:', err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playersColRef.path,
                operation: 'update',
            }));
        }
    }, [firestore, playersColRef, toast]);

    const saveSettlement = useCallback(async () => {
        const currentPlayers = playersRef.current;
        const key = getStorageKey();
        if (!key || !currentPlayers || currentPlayers.length === 0) return;
        try {
            const result = calculateSettlement(currentPlayers);
            const totalBuyIns = currentPlayers.reduce((t, p) => t + (p.rebuyTimestamps?.length ?? 0), 0);
            const snapshot: SettlementSnapshot = {
                id: Date.now().toString(),
                settledAt: Date.now() as any,
                players: currentPlayers.map(p => ({
                    name: p.name,
                    buyIns: p.rebuyTimestamps?.length ?? 0,
                    blackCoins: p.blackCoins,
                    balance: parseFloat(((p.blackCoins - (p.rebuyTimestamps?.length ?? 0)) * BUYIN_VALUE).toFixed(2)),
                    isHost: p.isHost,
                })),
                transactions: result.transactions,
                totalPot: totalBuyIns * BUYIN_VALUE,
            };
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.unshift(snapshot);
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
            setSettlements(existing.slice(0, 20));
            toast({ title: 'Settlement Saved', description: 'A snapshot of the current settlement has been saved.' });
        } catch (err) {
            console.error('Error saving settlement:', err);
        }
    }, [getStorageKey, toast]);

    const updateTableInfo = useCallback(async (data: Partial<Pick<Table, 'displayName' | 'pin'>>) => {
        if (!firestore || !tableId) return;
        try {
            const tableRef = doc(firestore, 'tables', tableId);
            await updateDoc(tableRef, data);
            setTableInfo(prev => prev ? { ...prev, ...data } : prev);
            toast({ title: 'Table Updated', description: 'Table settings have been updated.' });
        } catch (err) {
            console.error('Error updating table info:', err);
        }
    }, [firestore, tableId, toast]);

    const deleteTable = useCallback(async () => {
        if (!firestore || !tableId) return;
        try {
            if (playersRef.current.length > 0) {
                await saveSettlement();
            }
            await deleteAllPlayers();
            await deleteDoc(doc(firestore, 'tables', tableId));
            toast({ title: 'Table Closed', description: `Table "${tableId}" has been permanently closed.` });
        } catch (err) {
            console.error("Error closing table:", err);
        }
    }, [firestore, tableId, deleteAllPlayers, saveSettlement, toast, getStorageKey]);

    const value = useMemo<GameContextType>(
        () => ({
            players: players || [],
            isLoading: isAuthLoading || isPlayersLoading,
            isReady: !!playersColRef && !!user && !isAuthLoading,
            tableInfo,
            settlements,
            createPlayer,
            deletePlayer,
            deleteAllPlayers,
            addRebuy,
            removeRebuy,
            updateBlackCoins,
            requestRebuy,
            approveRebuy,
            deleteTable,
            setHost,
            saveSettlement,
            updateTableInfo,
            loadSettlements,
        }),
        [
            players,
            playersColRef,
            user,
            isAuthLoading,
            isPlayersLoading,
            tableInfo,
            settlements,
            createPlayer,
            deletePlayer,
            deleteAllPlayers,
            addRebuy,
            removeRebuy,
            updateBlackCoins,
            requestRebuy,
            approveRebuy,
            deleteTable,
            setHost,
            saveSettlement,
            updateTableInfo,
            loadSettlements,
        ]
    );

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return ctx;
}
