
"use client";

import { useState, Suspense } from "react";
import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { Users, Trash, XCircle, Link, Check } from "lucide-react";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { DistroSuggestion } from "./distro-suggestion";
import { useToast } from "@/hooks/use-toast";
import { Totals } from "./totals";
import { useRouter, useSearchParams } from "next/navigation";

function AddPlayerForm() {
    const [newPlayerName, setNewPlayerName] = useState("");
    const { createPlayer, players } = useGame();
    const { toast } = useToast();
  
    const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newPlayerName.trim();
      if (trimmedName) {
        const playerExists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
        if (playerExists) {
            toast({
                title: 'Player already exists',
                description: `A player named ${trimmedName} is already at the table. Player names must be unique (case-insensitive).`,
                variant: 'destructive',
            });
            return;
        }
        createPlayer(trimmedName);
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

function ResetGame() {
    const { deleteAllPlayers } = useGame();
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Trash/> Reset Game</CardTitle>
                <CardDescription>Remove all players to start a new game.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    title="Reset Game?"
                    description="Are you sure you want to remove all players? This action cannot be undone."
                    onConfirm={deleteAllPlayers}
                >
                    <Button variant="destructive" className="w-full">
                        Reset Game
                    </Button>
                </ConfirmationDialog>
            </CardContent>
        </Card>
    )
}

function CloseTable() {
    const { deleteTable } = useGame();
    const router = useRouter();

    const handleCloseTable = async () => {
        await deleteTable();
        router.push('/');
    };

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><XCircle /> Close Table</CardTitle>
                <CardDescription>Permanently remove this table and all of its players.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    title="Close and Remove Table?"
                    description="Are you sure you want to close this table? All players and re-buys will be deleted permanently. This action cannot be undone."
                    onConfirm={handleCloseTable}
                >
                    <Button variant="destructive" className="w-full">
                        Close Table
                    </Button>
                </ConfirmationDialog>
            </CardContent>
        </Card>
    );
}

function ShareJoinLink() {
    const searchParams = useSearchParams();
    const tableId = searchParams.get('table');
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const joinUrl = typeof window !== 'undefined' && tableId
        ? `${window.location.origin}/join?table=${encodeURIComponent(tableId)}`
        : '';

    const handleCopy = async () => {
        if (!joinUrl) return;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            toast({ title: 'Link Copied', description: 'Share this link with players to join the table.' });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
        }
    };

    if (!tableId) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="h-5 w-5" /> Share Join Link</CardTitle>
                <CardDescription>Share this link with players so they can join this table directly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{joinUrl}</code>
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function DealerView() {
  const { players } = useGame();
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold font-headline">Dealer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AddPlayerForm />
          <Totals />
          <Suspense><ShareJoinLink /></Suspense>
          <ResetGame />
          <CloseTable />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Player Standings</CardTitle>
                    <CardDescription>View all players and manage their re-buys.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerList isDealer={true} />
                </CardContent>
            </Card>

            <DistroSuggestion players={players} />
        </div>
    </div>
  );
}
