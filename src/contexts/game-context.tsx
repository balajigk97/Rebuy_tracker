'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'rebuy-tracker-game-state';

interface GameState {
  players: Player[];
  lastUpdated: string | null;
}

// --- Context ---
interface GameContextType {
  players: Player[];
  lastUpdated: string | null;
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (playerId: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- Provider ---
export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({ players: [], lastUpdated: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load from localStorage on initial client-side mount
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        setGameState(JSON.parse(savedStateJSON));
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
      setGameState({ players: [], lastUpdated: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          setGameState(newState);
        } catch (error) {
          console.error("Failed to parse state from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Unified function to update state and persist to localStorage
  const updateAndPersistState = useCallback((updater: (prevState: GameState) => GameState) => {
    setGameState(prevState => {
      const newState = updater(prevState);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
      return newState;
    });
  }, []);


  const addPlayer = useCallback(
    (name: string) => {
      updateAndPersistState(current => {
        if (current.players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
            toast({
              title: 'Player already exists',
              description: `${name} is already at the table.`,
              variant: 'destructive',
            });
            return current;
        }
        const newPlayer: Player = {
            id: uuidv4(),
            name,
            rebuys: 1,
            blackCoins: 0,
        };
        toast({
            title: 'Player Joined',
            description: `${name} has joined the table with 1 buy-in.`,
        });
        return {
            players: [...current.players, newPlayer],
            lastUpdated: new Date().toISOString(),
        };
      });
    },
    [updateAndPersistState, toast]
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
      updateAndPersistState(current => {
        const player = current.players.find((p) => p.id === playerId);
        if(player) {
          toast({
            title: 'Player Removed',
            description: `${player.name} has been removed from the table.`,
            variant: 'destructive',
          });
          return {
            players: current.players.filter((p) => p.id !== playerId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return current;
      });
    },
    [updateAndPersistState, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      updateAndPersistState(current => {
        const player = current.players.find((p) => p.id === playerId);
        if(player) {
            toast({
                title: 'Re-buy Added',
                description: `${player.name} has re-bought.`,
            });
            return {
                players: current.players.map((p) =>
                    p.id === playerId ? { ...p, rebuys: p.rebuys + 1 } : p
                ),
                lastUpdated: new Date().toISOString(),
            };
        }
        return current;
      });
    },
    [updateAndPersistState, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
      updateAndPersistState(current => {
        const player = current.players.find((p) => p.id === playerId);
        if (player) {
            if (player.rebuys <= 1) {
                toast({
                  title: 'Action Not Allowed',
                  description: 'Cannot remove the initial buy-in.',
                  variant: 'destructive',
                });
                return current;
            }
            toast({
                title: 'Re-buy Removed',
                description: `A re-buy was removed for ${player.name}.`,
                variant: 'destructive',
            });
            return {
                players: current.players.map((p) =>
                  p.id === playerId ? { ...p, rebuys: Math.max(1, p.rebuys - 1) } : p
                ),
                lastUpdated: new Date().toISOString(),
            };
        }
        return current;
      });
    },
    [updateAndPersistState, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return gameState.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [gameState.players]
  );

  const updateBlackCoins = useCallback((playerId: string, count: number) => {
    updateAndPersistState(current => {
        const validCount = Math.max(0, count);
        return {
            players: current.players.map((p) =>
                p.id === playerId ? { ...p, blackCoins: validCount } : p
            ),
            lastUpdated: new Date().toISOString(),
        };
    });
  }, [updateAndPersistState]);

  const value = useMemo(
    () => ({
      players: gameState.players,
      lastUpdated: gameState.lastUpdated,
      isLoading,
      addPlayer,
      deletePlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      gameState,
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

// --- Hook ---
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
