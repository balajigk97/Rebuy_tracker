
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog, History } from "lucide-react";

const PLAYER_NAME_KEY = "poker_player_name";

export function RoleSelector() {
  const [playerName, setPlayerName] = useState("");
  const [savedPlayerName, setSavedPlayerName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(PLAYER_NAME_KEY);
      setSavedPlayerName(savedName);
    } catch (e) {
      console.error("Could not access localStorage.", e);
    }
  }, []);

  const handlePlayerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      try {
        localStorage.setItem(PLAYER_NAME_KEY, playerName.trim());
      } catch (e) {
        console.error("Could not set item in localStorage.", e);
      }
      router.push(`/player?name=${encodeURIComponent(playerName.trim())}`);
    }
  };
  
  const handleDealerJoin = () => {
    router.push('/dealer');
  };

  const handleResumeSession = () => {
    if (savedPlayerName) {
      router.push(`/player?name=${encodeURIComponent(savedPlayerName)}`);
    }
  };

  const handleJoinAsNew = () => {
    try {
      localStorage.removeItem(PLAYER_NAME_KEY);
    } catch (e) {
      console.error("Could not remove item from localStorage.", e);
    }
    setSavedPlayerName(null);
  };

  if (savedPlayerName) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-primary-foreground/80">
          Welcome back, <strong className="font-bold text-accent">{savedPlayerName}</strong>!
        </p>
        <Button onClick={handleResumeSession} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <History className="mr-2 h-4 w-4" />
          Resume Session
        </Button>
        <Button onClick={handleJoinAsNew} variant="link" className="w-full text-primary-foreground/60">
          Join as new player
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="player" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-primary/20">
        <TabsTrigger value="player" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <User className="mr-2 h-4 w-4" /> Player
        </TabsTrigger>
        <TabsTrigger value="dealer" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <UserCog className="mr-2 h-4 w-4" /> Dealer
        </TabsTrigger>
      </TabsList>
      <TabsContent value="player" className="mt-4">
        <form onSubmit={handlePlayerJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-primary-foreground">Player Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              className="bg-background/80 text-foreground"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!playerName.trim()}>
            Join Game
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="dealer" className="mt-4">
         <div className="space-y-4 text-center">
            <p className="text-primary-foreground/80">
                Proceed to the password-protected dashboard to manage the game.
            </p>
            <Button onClick={handleDealerJoin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Enter as Dealer
            </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
