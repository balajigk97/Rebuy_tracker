"use client";

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./player-list";
import { Users } from "lucide-react";

interface PlayerViewProps {
  playerName: string;
}

export function PlayerView({ playerName }: PlayerViewProps) {
  const { getPlayerByName, addRebuy } = useGame();
  const player = getPlayerByName(playerName);

  if (!player) {
    return <div className="text-center">Loading player data...</div>;
  }
  
  const totalBuyins = player.rebuys;
  
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline">Welcome, {playerName}!</h1>
      
      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm">Total Buy-ins</p>
            <p className="text-5xl font-bold">{totalBuyins}</p>
          </div>
          <Button 
            onClick={() => addRebuy(player.id)} 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            Request Re-buy
          </Button>
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
