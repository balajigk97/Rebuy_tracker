
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog } from "lucide-react";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export function RoleSelector() {
  const [playerName, setPlayerName] = useState("");
  const [dealerEmail, setDealerEmail] = useState("test@test.com");
  const [dealerPassword, setDealerPassword] = useState("test1234");
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      router.push(`/dashboard?role=player&name=${encodeURIComponent(playerName.trim())}`);
    }
  };
  
  const handleDealerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({
            title: "Authentication Error",
            description: "Authentication service is not available. Please try again later.",
            variant: "destructive",
        });
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, dealerEmail, dealerPassword);
        router.push('/dashboard?role=dealer');
    } catch (error) {
        console.error("Dealer sign-in failed", error);
        toast({
            title: "Sign-in Failed",
            description: "Could not sign in as dealer. Please check credentials or try again.",
            variant: "destructive",
        });
    }
  };

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
        <form onSubmit={handlePlayerLogin} className="space-y-4">
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
         <form onSubmit={handleDealerLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-primary-foreground">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="dealer@example.com"
                value={dealerEmail}
                onChange={(e) => setDealerEmail(e.target.value)}
                required
                className="bg-background/80 text-foreground"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password"  className="text-primary-foreground">Password</Label>
                <Input
                id="password"
                type="password"
                value={dealerPassword}
                onChange={(e) => setDealerPassword(e.target.value)}
                required
                className="bg-background/80 text-foreground"
                />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Login as Dealer
            </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
