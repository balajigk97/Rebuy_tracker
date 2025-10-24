
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
  const [dealerEmail, setDealerEmail] = useState("");
  const [dealerPassword, setDealerPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

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
    if (!dealerEmail || !dealerPassword) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, dealerEmail, dealerPassword);
      router.push('/dashboard?role=dealer');
    } catch (error: any) {
      console.error("Dealer login failed", error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      router.push(`/dashboard?role=player&name=${encodeURIComponent(playerName.trim())}`);
    }
  };
  
  const handleDealerClick = () => {
    router.push('/dashboard?role=dealer');
  };

  return (
    <Tabs defaultValue="player" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-primary/20">
        <TabsTrigger value="player" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <User className="mr-2 h-4 w-4" /> Player
        </TabsTrigger>
        <TabsTrigger value="dealer" onClick={handleDealerClick} className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
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
         <p className="text-center text-primary-foreground/80">You will be redirected to log in as the dealer.</p>
      </TabsContent>
    </Tabs>
  );
}
