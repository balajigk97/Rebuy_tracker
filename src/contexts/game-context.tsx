"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

interface GameContextType {
  players: Player[];
  addPlayer: (name: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialPlayers: Player[] = [
    { id: '1', name: 'Alice', rebuys: 1, blackCoins: 0 },
    { id: '2', name: 'Bob', rebuys: 2, blackCoins: 0 },
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [lastAction, setLastAction] = useState<{type: string, payload: any} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!lastAction) return;

    switch (lastAction.type) {
        case 'ADD_PLAYER':
            toast({
                title: "Player Joined",
                description: `${lastAction.payload.name} has joined the table with 1 buy-in.`,
            });
            break;
        case 'ADD_REBUY':
            toast({
                title: "Re-buy Added",
                description: `${lastAction.payload.name} has re-bought.`,
            });
            break;
        case 'REMOVE_REBUY_SUCCESS':
            toast({
                title: "Re-buy Removed",
                description: `A re-buy was removed for ${lastAction.payload.name}.`,
                variant: "destructive"
            });
            break;
        case 'REMOVE_REBUY_FAILED':
             toast({
                title: "Action Not Allowed",
                description: "Cannot remove the initial buy-in.",
                variant: "destructive"
            });
            break;
    }
    setLastAction(null);
  }, [lastAction, toast]);


  const addPlayer = (name: string) => {
    setPlayers(prevPlayers => {
        const existingPlayer = prevPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingPlayer) {
            return prevPlayers;
        }
        const newPlayer: Player = { id: Date.now().toString(), name, rebuys: 1, blackCoins: 0 };
        setLastAction({ type: 'ADD_PLAYER', payload: { name } });
        return [...prevPlayers, newPlayer];
    });
  };

  const addRebuy = (playerId: string) => {
    setPlayers(players.map(p => {
        if (p.id === playerId) {
            setLastAction({ type: 'ADD_REBUY', payload: { name: p.name } });
            return { ...p, rebuys: p.rebuys + 1 };
        }
        return p;
    }));
  };
  
  const removeRebuy = (playerId: string) => {
    setPlayers(players.map(p => {
        if (p.id === playerId && p.rebuys > 1) {
            setLastAction({ type: 'REMOVE_REBUY_SUCCESS', payload: { name: p.name } });
            return { ...p, rebuys: p.rebuys - 1 };
        }
        if (p.id === playerId && p.rebuys <= 1) {
             setLastAction({ type: 'REMOVE_REBUY_FAILED', payload: {} });
        }
        return p;
    }));
  };

  const getPlayerByName = (name: string): Player | undefined => {
    return players.find(p => p.name.toLowerCase() === name.toLowerCase());
  }

  const updateBlackCoins = (playerId: string, count: number) => {
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        return { ...p, blackCoins: count >= 0 ? count : 0 };
      }
      return p;
    }));
  }

  return (
    <GameContext.Provider value={{ players, addPlayer, addRebuy, removeRebuy, getPlayerByName, updateBlackCoins }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
