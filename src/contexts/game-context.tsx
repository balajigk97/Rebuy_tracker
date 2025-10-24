'use client';
import { createContext, useContext } from 'react';
import type { Player } from '@/lib/types';

export interface GameContextType {
  players: Player[];
  lastUpdated: string | null;
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (id: string) => void;
  addRebuy: (id: string) => void;
  removeRebuy: (id: string) => void;
  updateBlackCoins: (id: string, count: number) => void;
  getPlayerByName: (name: string) => Player | undefined;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
