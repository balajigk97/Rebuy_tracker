"use client";

import { useState } from "react";
import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { Users } from "lucide-react";

function AddPlayerForm() {
    const [newPlayerName, setNewPlayerName] = useState("");
    const { addPlayer } = useGame();
  
    const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPlayerName.trim()) {
        addPlayer(newPlayerName.trim());
        setNewPlayerName("");
      }
    };
  
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New Player</CardTitle>
                <CardDescription>Add a player to the table. They will start with one buy-in.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddPlayer} className="flex gap-2">
                    <Input
                        placeholder="Player Name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                    <Button type="submit" disabled={!newPlayerName.trim()}>Add Player</Button>
                </form>
            </CardContent>
      </Card>
    );
  }

export function DealerView() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold font-headline">Dealer Dashboard</h1>
        <AddPlayerForm />
      
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Player Standings</CardTitle>
                <CardDescription>View all players and manage their re-buys.</CardDescription>
            </CardHeader>
            <CardContent>
                <PlayerList isDealer={true} />
            </CardContent>
        </Card>
    </div>
  );
}
