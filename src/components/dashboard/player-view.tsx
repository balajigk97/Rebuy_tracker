
'use client';

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./player-list";
import { Users, Clock, PlusCircle, DollarSign, Coins } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { HOST_FEE, BUYIN_VALUE } from "@/lib/settlement";
import { cn } from "@/lib/utils";

interface PlayerViewProps {
  playerName: string;
}

function PlayerViewSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm">Total Buy-ins</p>
            <Skeleton className="h-14 w-12 mt-1" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users /> Table Standings
          </CardTitle>
          <CardDescription>
            See how you stack up against the competition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PlayerView({ playerName }: PlayerViewProps) {
  const { players, requestRebuy, isLoading } = useGame();

  if (isLoading) {
    return <PlayerViewSkeleton />;
  }

  const player = players.find(p => p.name === playerName);

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
            <h2 className="text-2xl font-semibold">Waiting for the dealer...</h2>
            <p className="text-muted-foreground mt-2">
            Your name will appear on the list once the dealer has added you to the game.
            </p>
        </div>
      </div>
    );
  }

  const totalBuyins = player.rebuyTimestamps?.length ?? 0;
  const blackCoins = player.blackCoins;
  const netChips = blackCoins - totalBuyins;
  const netDollars = netChips * BUYIN_VALUE;

  const handleRebuyRequest = () => {
    requestRebuy(player.id);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline">Welcome, {playerName}!</h1>

      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
              <div>
                <p className="text-sm opacity-80">Buy-ins</p>
                <p className="text-4xl sm:text-5xl font-bold">{totalBuyins}</p>
              </div>
              <div>
                <p className="text-sm opacity-80 flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Black Coins</p>
                <p className="text-4xl sm:text-5xl font-bold">{blackCoins}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Net Balance</p>
                <p className={cn("text-3xl sm:text-4xl font-bold", netDollars > 0 && "text-green-300", netDollars < 0 && "text-red-300")}>
                  {netDollars >= 0 ? '+' : '-'}${Math.abs(netDollars)}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              {player.hasPendingRebuyRequest ? (
                <Button size="lg" disabled className="bg-accent/50 text-accent-foreground w-full sm:w-auto">
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Request Pending...
                </Button>
              ) : (
                <ConfirmationDialog
                  title="Confirm Re-buy Request"
                  description="Are you sure you want to request a re-buy? The dealer will be notified."
                  onConfirm={handleRebuyRequest}
                >
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Request Re-buy
                  </Button>
                </ConfirmationDialog>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm opacity-80 border-t border-white/20 pt-3">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>1 Buy-in: <span className="font-semibold">${BUYIN_VALUE}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Host fee: <span className="font-semibold">${HOST_FEE.toFixed(2)}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Table Standings</CardTitle>
          <CardDescription>See how you stack up against the competition.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerList highlightPlayerName={playerName} />
        </CardContent>
      </Card>
    </div>
  );
}
