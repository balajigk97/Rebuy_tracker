
'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shuffle, User, Crown, AlertTriangle, Camera, Share2, Loader2 } from 'lucide-react';
import { calculateSettlement, HOST_FEE, BUYIN_VALUE, type Transaction, type PlayerBreakdown } from '@/lib/settlement';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface DistroSuggestionProps {
  players: Player[];
}

function isPlayer(obj: any): obj is Player {
    return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'rebuyTimestamps' in obj && Array.isArray(obj.rebuyTimestamps);
}

function PlayerBalances({ breakdowns }: { breakdowns: PlayerBreakdown[] }) {
    const sorted = useMemo(() => [...breakdowns].sort((a, b) => b.balance - a.balance), [breakdowns]);

    return (
        <div className="space-y-2">
             <h4 className="text-sm font-medium text-muted-foreground">Final Balances (incl. host fee)</h4>
            <ul className="space-y-2">
                {sorted.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-sm animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
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

function UnbalancedBreakdown({ breakdowns }: { breakdowns: PlayerBreakdown[] }) {
    const mismatched = breakdowns.filter(p => p.delta !== 0);
    const sorted = [...breakdowns].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-destructive">Chip counts don't match buy-ins</p>
                    <p className="text-destructive/80 mt-1">Enter black coin counts for each player so totals match. The table below shows who's off:</p>
                </div>
            </div>
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">Player</th>
                            <th className="text-center p-2 font-medium">Buy-ins</th>
                            <th className="text-center p-2 font-medium">Coins</th>
                            <th className="text-center p-2 font-medium">Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p, i) => (
                            <tr key={i} className={cn("border-b last:border-0", p.delta !== 0 && "bg-destructive/5")}>
                                <td className="p-2 flex items-center gap-1.5">
                                    {p.isHost && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                    {p.name}
                                </td>
                                <td className="text-center p-2">{p.buyIns}</td>
                                <td className="text-center p-2">{p.blackCoins}</td>
                                <td className={cn("text-center p-2 font-bold", p.delta > 0 && "text-green-600", p.delta < 0 && "text-destructive")}>
                                    {p.delta === 0 ? '—' : (p.delta > 0 ? `+${p.delta}` : p.delta)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export function DistroSuggestion({ players }: DistroSuggestionProps) {
  const settlement = useMemo(() => calculateSettlement(players), [players]);
  const { transactions, hostName, hostFeePerPlayer, totalHostFee, playerBreakdowns } = settlement;
  const totalBuyIns = players.reduce((total, player) => total + (player.rebuyTimestamps?.length ?? 0), 0);
  const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
  const isBalanced = Math.abs(totalBuyIns - totalBlackCoins) < 0.01 && totalBuyIns > 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveAsImage = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

      if (canShareFiles) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File([blob], 'settlement.png', { type: 'image/png' });
          const shareData = { files: [file], title: 'Poker Settlement' };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
      }

      const link = document.createElement('a');
      link.download = 'settlement.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error saving image:', err);
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <div className="space-y-2">
    <Card ref={cardRef}>
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
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-in fade-in duration-300">
            <Crown className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{hostName}</span> is the host.
              Each player pays <span className="font-bold">${hostFeePerPlayer.toFixed(2)}</span> host fee
              (total: <span className="font-bold">${totalHostFee.toFixed(2)}</span>).
            </p>
          </div>
        )}

        {isBalanced && <PlayerBalances breakdowns={playerBreakdowns} />}

        <Separator />

        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Payouts</h4>
            {!isBalanced ? (
                <UnbalancedBreakdown breakdowns={playerBreakdowns} />
            ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center text-center p-4 bg-muted/50 rounded-lg h-full animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground">All players are settled. No payments needed.</p>
            </div>
            ) : (
            <ul className="space-y-3">
                {transactions.map((tx, index) => (
                <li
                    key={index}
                    className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
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
    {isBalanced && (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={saveAsImage}
        disabled={isSaving}
      >
        {isSaving ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Capturing...</>
        ) : (
          <><Camera className="h-4 w-4 mr-1" /> Save as Image</>
        )}
      </Button>
    )}
    </div>
  );
}
