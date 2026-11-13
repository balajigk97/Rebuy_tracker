
"use client";

import { useState, useEffect, Suspense } from "react";
import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { PlayerNameInput } from "@/components/ui/player-name-input";
import { Users, Trash, XCircle, Link, Check, Settings, Save, History, Trophy, Lock, Unlock } from "lucide-react";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { DistroSuggestion } from "./distro-suggestion";
import { useToast } from "@/hooks/use-toast";
import { Totals } from "./totals";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { BUYIN_VALUE } from "@/lib/settlement";
import { format } from "date-fns";

function AddPlayerForm() {
    const [newPlayerName, setNewPlayerName] = useState("");
    const { createPlayer, players } = useGame();
    const { toast } = useToast();

    const existingNames = players.map(p => p.name);

    const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newPlayerName.trim();
      if (trimmedName) {
        const playerExists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
        if (playerExists) {
            toast({
                title: 'Player already exists',
                description: `A player named ${trimmedName} is already at the table.`,
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
                    <PlayerNameInput
                        placeholder="Player Name"
                        value={newPlayerName}
                        onChange={setNewPlayerName}
                        excludeNames={existingNames}
                    />
                    <Button type="submit" disabled={!newPlayerName.trim()}>Add Player</Button>
                </form>
            </CardContent>
      </Card>
    );
}

function TableSettings() {
    const { tableInfo, updateTableInfo } = useGame();
    const [displayName, setDisplayName] = useState(tableInfo?.displayName || '');
    const [pin, setPin] = useState(tableInfo?.pin || '');
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        await updateTableInfo({
            displayName: displayName.trim() || undefined,
            pin: pin.trim() || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Table Settings</CardTitle>
                <CardDescription>Set a display name and dealer PIN for this table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                    <Input id="displayName" placeholder="e.g. Friday Night Poker" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pin" className="text-xs">Dealer PIN</Label>
                    <Input id="pin" type="password" placeholder="Custom dealer password" value={pin} onChange={(e) => setPin(e.target.value)} />
                </div>
                <Button size="sm" className="w-full" onClick={handleSave}>
                    {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : <><Save className="h-4 w-4 mr-1" /> Save Settings</>}
                </Button>
            </CardContent>
        </Card>
    );
}

function GameLockToggle() {
    const { tableInfo, setTableLocked } = useGame();
    const isLocked = tableInfo?.isSettled ?? false;

    return (
        <Card className={isLocked ? "border-amber-500/50" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isLocked ? <Lock className="h-5 w-5 text-amber-500" /> : <Unlock className="h-5 w-5" />}
                    Game Access
                </CardTitle>
                <CardDescription>
                    {isLocked
                        ? "Game is locked. No new players can join. Data expires in 30 days."
                        : "Game is open. New players can join freely."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    size="sm"
                    className="w-full"
                    variant={isLocked ? "outline" : "destructive"}
                    onClick={() => setTableLocked(!isLocked)}
                >
                    {isLocked ? (
                        <><Unlock className="h-4 w-4 mr-1" /> Unlock Game</>
                    ) : (
                        <><Lock className="h-4 w-4 mr-1" /> Lock Game</>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

function SaveSettlementButton() {
    const { saveSettlement, players } = useGame();
    const totalBuyIns = players.reduce((t, p) => t + (p.rebuyTimestamps?.length ?? 0), 0);
    const totalBlackCoins = players.reduce((t, p) => t + (p.blackCoins ?? 0), 0);
    const isBalanced = totalBuyIns === totalBlackCoins && totalBuyIns > 0;

    return (
        <Button
            variant="outline"
            size="sm"
            disabled={!isBalanced}
            onClick={saveSettlement}
            className="w-full"
        >
            <Save className="h-4 w-4 mr-1" />
            Save Settlement Snapshot
        </Button>
    );
}

function SettlementHistory() {
    const { settlements, loadSettlements } = useGame();

    useEffect(() => {
        loadSettlements();
    }, [loadSettlements]);

    if (!settlements || settlements.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Past Settlements</CardTitle>
                <CardDescription>Previously saved settlement snapshots.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {settlements.map((s) => (
                    <div key={s.id} className="rounded-lg border p-3 space-y-2 text-sm animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{s.settledAt ? format(typeof s.settledAt === 'number' ? new Date(s.settledAt) : (s.settledAt as any).toDate ? (s.settledAt as any).toDate() : new Date(), 'MMM d, h:mm a') : 'Unknown'}</span>
                            <span className="font-bold text-green-600">${s.totalPot} pot</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            {s.players?.map((p, i) => (
                                <div key={i} className="flex justify-between">
                                    <span>{p.name}{p.isHost ? ' (host)' : ''}</span>
                                    <span className={p.balance > 0 ? 'text-green-600' : p.balance < 0 ? 'text-destructive' : ''}>
                                        {p.balance > 0 ? '+' : ''}${p.balance.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {s.transactions?.length > 0 && (
                            <div className="text-xs border-t pt-1.5 space-y-0.5">
                                {s.transactions.map((tx, i) => (
                                    <div key={i} className="text-muted-foreground">{tx.from} → {tx.to}: ${tx.amount.toFixed(2)}</div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
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
                <CardDescription>Permanently remove this table and all of its players. A settlement snapshot is saved automatically.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    title="Close and Remove Table?"
                    description="Are you sure you want to close this table? All players and re-buys will be deleted permanently. A final settlement snapshot will be saved before deletion."
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          <AddPlayerForm />
          <Totals />
          <Suspense><ShareJoinLink /></Suspense>
          <TableSettings />
          <GameLockToggle />
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

            <div className="space-y-4">
                <DistroSuggestion players={players} />
                <SaveSettlementButton />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <NextLink href="/stats">
                    <Trophy className="h-4 w-4 mr-1" /> Hall of Fame
                  </NextLink>
                </Button>
                <SettlementHistory />
            </div>
        </div>
    </div>
  );
}
