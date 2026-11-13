"use client";

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Banknote, Landmark, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUYIN_VALUE } from "@/lib/settlement";

export function Totals() {
    const { players } = useGame();
    const totalBuyIns = players.reduce((total, player) => total + (player.rebuyTimestamps?.length ?? 0), 0);
    const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
    const totalsMatch = Math.abs(totalBuyIns - totalBlackCoins) < 0.01;
    const totalPot = totalBuyIns * BUYIN_VALUE;

    return (
        <Card className={cn("transition-colors lg:col-span-2", !totalsMatch && totalBuyIns > 0 && "bg-destructive/10 border-destructive")}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Landmark />
                    Game Totals
                </CardTitle>
                <CardDescription>
                    {totalBuyIns === 0
                        ? "Add players to get started."
                        : totalsMatch
                        ? "The pot is balanced. Ready for settlement."
                        : "Totals are unbalanced. Chip counts do not match buy-ins."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Total Pot</span>
                    <span className="text-3xl font-bold text-green-700 dark:text-green-400">${totalPot}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            Players
                        </div>
                        <p className="text-3xl font-bold">{players.length}</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            Buy-ins
                        </div>
                        <p className={cn("text-3xl font-bold transition-colors", !totalsMatch && totalBuyIns > 0 && "text-destructive")}>{totalBuyIns}</p>
                    </div>
                     <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Banknote className="h-3.5 w-3.5" />
                            Black Coins
                        </div>
                        <p className={cn("text-3xl font-bold transition-colors", !totalsMatch && totalBuyIns > 0 && "text-destructive")}>{totalBlackCoins}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
