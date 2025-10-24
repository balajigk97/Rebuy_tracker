
'use client';

import React, { useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { GameContext, GameContextType } from './game-context';

const LOCAL_STORAGE_KEY = 'rebuy-tracker-game-state';

interface GameState {
  players: Player[];
  lastUpdated: string | null;
}

export function GameClientProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({ players: [], lastUpdated: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        setGameState(JSON.parse(savedState));
      }
    } catch (error) {
      console.error("Failed to parse game state from localStorage", error);
    } finally {
      setIsLoading(false);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          setGameState(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Failed to parse game state from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setAndPersistState = useCallback((newState: GameState) => {
    try {
      const newStateJSON = JSON.stringify(newState);
      localStorage.setItem(LOCAL_STORAGE_KEY, newStateJSON);
      // Manually update the state for the current tab
      setGameState(newState);
    } catch (error) {
      console.error("Failed to save game state to localStorage", error);
    }
  }, []);

  const addPlayer = useCallback((name: string) => {
    setGameState(currentGameState => {
      if (currentGameState.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: 'Player exists', description: `${name} already joined`, variant: 'destructive' });
        return currentGameState;
      }
      const newPlayer: Player = { id: uuidv4(), name, rebuys: 1, blackCoins: 0 };
      const newState: GameState = {
        players: [...currentGameState.players, newPlayer],
        lastUpdated: new Date().toISOString(),
      };
      setAndPersistState(newState);
      toast({ title: 'Player Added', description: `${name} joined` });
      return newState;
    });
  }, [setAndPersistState, toast]);

  const deletePlayer = useCallback((id: string) => {
    setGameState(currentGameState => {
      const player = currentGameState.players.find(p => p.id === id);
      const newState: GameState = {
        players: currentGameState.players.filter(p => p.id !== id),
        lastUpdated: new Date().toISOString(),
      };
      setAndPersistState(newState);
      if (player) {
        toast({ title: 'Player Removed', description: player.name, variant: 'destructive' });
      }
      return newState;
    });
  }, [setAndPersistState, toast]);

  const addRebuy = useCallback((id: string) => {
    let playerName = '';
    setGameState(currentGameState => {
      const newPlayers = currentGameState.players.map(p => {
        if (p.id === id) {
          playerName = p.name;
          return { ...p, rebuys: p.rebuys + 1 };
        }
        return p;
      });
      const newState = {
        ...currentGameState,
        players: newPlayers,
        lastUpdated: new Date().toISOString(),
      };
      setAndPersistState(newState);
      if (playerName) {
        toast({ title: 'Rebuy Added', description: `For ${playerName}` });
      }
      return newState;
    });
  }, [setAndPersistState, toast]);

  const removeRebuy = useCallback((id: string) => {
    let playerCanRemove = false;
    let playerName = '';
    setGameState(currentGameState => {
      const player = currentGameState.players.find(p => p.id === id);
      if (player) {
        playerName = player.name;
        if (player.rebuys <= 1) {
          toast({
            title: 'Action Not Allowed',
            description: 'Cannot remove the initial buy-in.',
            variant: 'destructive',
          });
          return currentGameState;
        }
        playerCanRemove = true;
      }

      if (playerCanRemove) {
        const newState = {
          ...currentGameState,
          players: currentGameState.players.map(p =>
            p.id === id ? { ...p, rebuys: p.rebuys - 1 } : p
          ),
          lastUpdated: new Date().toISOString(),
        };
        setAndPersistState(newState);
        toast({ title: 'Rebuy Removed', description: `For ${playerName}`, variant: 'destructive' });
        return newState;
      }
      return currentGameState;
    });
  }, [setAndPersistState, toast]);

  const updateBlackCoins = useCallback((id: string, count: number) => {
    setGameState(currentGameState => {
      const newState = {
        ...currentGameState,
        players: currentGameState.players.map(p =>
          p.id === id ? { ...p, blackCoins: Math.max(0, count) } : p
        ),
        lastUpdated: new Date().toISOString(),
      };
      setAndPersistState(newState);
      return newState;
    });
  }, [setAndPersistState]);

  const getPlayerByName = useCallback((name: string) => {
    return gameState.players.find(p => p.name.toLowerCase() === name.toLowerCase());
  }, [gameState.players]);

  const value: GameContextType = useMemo(() => ({
    players: gameState.players,
    lastUpdated: gameState.lastUpdated,
    isLoading,
    addPlayer,
    deletePlayer,
    addRebuy,
    removeRebuy,
    updateBlackCoins,
    getPlayerByName,
  }), [gameState, isLoading, addPlayer, deletePlayer, addRebuy, removeRebuy, updateBlackCoins, getPlayerByName]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
