
import type { Player } from './types';

export const HOST_FEE = 2.5;
export const BUYIN_VALUE = 5;

export interface Balance {
  name: string;
  amount: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementResult {
  transactions: Transaction[];
  hostName: string | null;
  hostFeePerPlayer: number;
  totalHostFee: number;
}

export function calculateSettlement(players: Player[]): SettlementResult {
  const empty: SettlementResult = { transactions: [], hostName: null, hostFeePerPlayer: 0, totalHostFee: 0 };
  if (!players || players.length === 0) {
    return empty;
  }

  const host = players.find(p => p.isHost);
  const nonHostCount = host ? players.length - 1 : 0;
  const totalHostFee = host ? nonHostCount * HOST_FEE : 0;

  const balances: Balance[] = players.map(player => {
    let amount = (player.blackCoins - (player.rebuyTimestamps?.length ?? 0)) * BUYIN_VALUE;
    if (host) {
      if (player.isHost) {
        amount += totalHostFee;
      } else {
        amount -= HOST_FEE;
      }
    }
    return { name: player.name, amount };
  });

  const debtors = balances
    .filter(p => p.amount < 0)
    .map(p => ({ ...p, amount: -p.amount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter(p => p.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amountToSettle = Math.min(creditor.amount, debtor.amount);

    if (amountToSettle > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: parseFloat(amountToSettle.toFixed(2)),
      });

      creditor.amount -= amountToSettle;
      debtor.amount -= amountToSettle;
    }

    if (Math.abs(creditor.amount) < 0.001) {
      i++;
    }

    if (Math.abs(debtor.amount) < 0.001) {
      j++;
    }
  }

  return {
    transactions,
    hostName: host?.name ?? null,
    hostFeePerPlayer: host ? HOST_FEE : 0,
    totalHostFee,
  };
}
