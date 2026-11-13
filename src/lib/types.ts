
import { Timestamp } from "firebase/firestore";

export type Player = {
  id: string;
  name: string;
  blackCoins: number;
  createdAt: Timestamp;
  rebuyTimestamps: Timestamp[];
  hasPendingRebuyRequest: boolean;
  isHost: boolean;
};

export type Table = {
  id: string;
  displayName?: string;
  pin?: string;
  lastActive: Timestamp;
  isSettled?: boolean;
  settledAt?: Timestamp;
  expireAt?: Timestamp;
};

export type PlayerStats = {
  id: string;
  name: string;
  gamesPlayed: number;
  totalBuyIns: number;
  totalProfit: number;
  lastPlayed: Timestamp;
};

export type SettlementSnapshot = {
  id: string;
  settledAt: Timestamp;
  players: {
    name: string;
    buyIns: number;
    blackCoins: number;
    balance: number;
    isHost: boolean;
  }[];
  transactions: {
    from: string;
    to: string;
    amount: number;
  }[];
  totalPot: number;
};
