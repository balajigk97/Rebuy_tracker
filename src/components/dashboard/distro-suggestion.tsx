
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shuffle, User, Crown } from 'lucide-react';
import { calculateSettlement, HOST_FEE, BUYIN_VALUE, type Transaction } from '@/lib/settlement';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface DistroSuggestionProps {
  players: Player[];
}

function isPlayer(obj: any): obj is Player {
    return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'rebuyTimestamps' in obj && Array.isArray(obj.rebuyTimestamps);
}

function PlayerBalances({ players }: { players: Player[] }) {
    const host = players.find(p => p.isHost);
    const nonHostCount = host ? players.length - 1 : 0;
    const totalHostFee = host ? nonHostCount * HOST_FEE : 0;

    const balances = useMemo(() => {
        const validPlayers = Array.isArray(players) ? players.filter(isPlayer) : [];
        return validPlayers.map(p => {
            let balance = (p.blackCoins - (p.rebuyTimestamps?.length ?? 0)) * BUYIN_VALUE;
            if (host) {
                if (p.isHost) {
                    balance += totalHostFee;
                } else {
                    balance -= HOST_FEE;
                }
            }
            return {
                id: p.id,
                name: p.name,
                balance: parseFloat(balance.toFixed(2)),
                isHost: p.isHost,
            };
        }).sort((a,b) => b.balance - a.balance);
    }, [players, host, totalHostFee]);

    return (
        <div className="space-y-2">
             <h4 className="text-sm font-medium text-muted-foreground">Final Balances (incl. host fee)</h4>
            <ul className="space-y-2">
                {balances.map(p => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            {p.isHost ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4 text-muted-foreground" />}
                            {p.name}
                        </span>
                        <span className={cn(
                            "font-bold",
                            p.balance > 0 && "text-green-600",
                            p.balance < 0 && "text-destructive",
                        )}>
                            {p.balance > 0 ? "+$" : p.balance < 0 ? "-$" : "$"}{Math.abs(p.balance).toFixed(2)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}


export function DistroSuggestion({ players }: DistroSuggestionProps) {
  const settlement = useMemo(() => calculateSettlement(players), [players]);
  const { transactions, hostName, hostFeePerPlayer, totalHostFee } = settlement;
  const totalBuyIns = players.reduce((total, player) => total + (player.rebuyTimestamps?.length ?? 0), 0);
  const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
  const isBalanced = totalBuyIns === totalBlackCoins && totalBuyIns > 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle />
          Settlement
        </CardTitle>
        <CardDescription>
          Final player balances and efficient payment suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {hostName && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Crown className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{hostName}</span> is the host.
              Each player pays <span className="font-bold">${hostFeePerPlayer.toFixed(2)}</span> host fee
              (total: <span className="font-bold">${totalHostFee.toFixed(2)}</span>).
            </p>
          </div>
        )}

        <PlayerBalances players={players} />

        <Separator />

        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Payouts</h4>
            {!isBalanced ? (
                <div className="flex flex-col items-center justify-center text-center p-4 bg-destructive/10 rounded-lg h-full">
                    <p className="text-sm font-semibold text-destructive">Totals Don't Match</p>
                    <p className="text-xs text-destructive/80 mt-1">Player balances cannot be calculated until the total buy-ins match the total black coins on the table.</p>
                </div>
            ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center text-center p-4 bg-muted/50 rounded-lg h-full">
                <p className="text-sm text-muted-foreground">All players are settled. No payments needed.</p>
            </div>
            ) : (
            <ul className="space-y-3">
                {transactions.map((tx, index) => (
                <li
                    key={index}
                    className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md"
                >
                    <span className="font-semibold text-destructive">{tx.from}</span>
                    <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">${tx.amount.toFixed(2)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-green-600">{tx.to}</span>
                </li>
                ))}
            </ul>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
