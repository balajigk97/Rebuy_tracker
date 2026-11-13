
"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "@/contexts/game-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Trash2, User, Info, CheckCircle, Crown, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import type { Player } from "@/lib/types";

interface PlayerListProps {
  isDealer?: boolean;
  highlightPlayerName?: string;
}

function PlayerListSkeleton() {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Buy-ins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-6 w-8 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

function RebuyTooltip({ timestamps }: { timestamps: Timestamp[] }) {
    if (!timestamps || timestamps.length === 0) {
      return null;
    }

    const sortedTimestamps = [...timestamps].sort((a, b) => a.toMillis() - b.toMillis());

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center gap-1 cursor-help">
              {timestamps.length}
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-2 text-sm">
              <p className="font-bold mb-2 border-b pb-1">Buy-in History</p>
              <ul className="space-y-1">
                {sortedTimestamps.map((ts, index) => (
                  <li key={index} className="text-xs">
                    <span className="font-semibold">{index === 0 ? 'Buy-in:' : `Re-buy #${index}:`}</span>
                    <span className="ml-2">{format(ts.toDate(), "h:mm:ss a")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

function DebouncedCoinInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const commit = useCallback((v: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeRef.current(v), 400);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value) || 0;
    const clamped = Math.max(0, v);
    setLocal(clamped);
    commit(clamped);
  };

  const step = (delta: number) => {
    const v = Math.max(0, parseFloat((local + delta).toFixed(2)));
    setLocal(v);
    onChangeRef.current(v);
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => step(-1)} disabled={local <= 0}>
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        type="number"
        step="0.5"
        className="w-16 text-center h-8 px-1"
        value={local}
        onChange={handleChange}
        min={0}
      />
      <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => step(1)}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function isPlayer(obj: any): obj is Player {
    return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'rebuyTimestamps' in obj && Array.isArray(obj.rebuyTimestamps);
}

function DealerPlayerCard({ player, addRebuy, removeRebuy, deletePlayer, updateBlackCoins, approveRebuy, setHost }: {
  player: Player;
  addRebuy: (id: string) => void;
  removeRebuy: (id: string) => void;
  deletePlayer: (id: string) => void;
  updateBlackCoins: (id: string, count: number) => void;
  approveRebuy: (id: string) => void;
  setHost: (id: string) => void;
}) {
  const endCount = parseFloat((player.blackCoins - (player.rebuyTimestamps?.length ?? 0)).toFixed(2));

  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3",
      player.hasPendingRebuyRequest && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span>{player.name}</span>
          {player.isHost && <Crown className="h-4 w-4 text-amber-500" />}
          {player.hasPendingRebuyRequest && (
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 animate-pulse">(Rebuy!)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHost(player.id)} disabled={player.isHost}>
                  <Crown className={cn("h-4 w-4", player.isHost ? "text-amber-500" : "text-muted-foreground")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{player.isHost ? "Current host" : "Set as host"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ConfirmationDialog
            title="Delete Player?"
            description={`Are you sure you want to delete ${player.name}? This action cannot be undone.`}
            onConfirm={() => deletePlayer(player.id)}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmationDialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Buy-ins</p>
          <p className="font-bold text-lg">{player.rebuyTimestamps?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Coins</p>
          <DebouncedCoinInput value={player.blackCoins} onChange={(v) => updateBlackCoins(player.id, v)} />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Net</p>
          <p className={cn("font-bold text-lg", endCount > 0 && "text-green-600", endCount < 0 && "text-destructive")}>{endCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {player.hasPendingRebuyRequest ? (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => approveRebuy(player.id)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Approve Rebuy
          </Button>
        ) : (
          <ConfirmationDialog
            title={`Add Re-buy for ${player.name}?`}
            description="Are you sure you want to manually add a re-buy for this player?"
            onConfirm={() => addRebuy(player.id)}
          >
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-1 text-green-600" /> Add
            </Button>
          </ConfirmationDialog>
        )}
        <ConfirmationDialog
          title={`Remove Last Re-buy from ${player.name}?`}
          description="This will remove the most recent buy-in."
          onConfirm={() => removeRebuy(player.id)}
          confirmText="Yes, Remove"
        >
          <Button variant="outline" size="sm" disabled={(player.rebuyTimestamps?.length ?? 0) <= 1}>
            <MinusCircle className="h-4 w-4 mr-1" /> Remove
          </Button>
        </ConfirmationDialog>
      </div>
    </div>
  );
}

export function PlayerList({ isDealer = false, highlightPlayerName }: PlayerListProps) {
  const { players, addRebuy, removeRebuy, deletePlayer, updateBlackCoins, isLoading, approveRebuy, setHost } = useGame();

  const sortedPlayers = useMemo(() => {
    const validPlayers = Array.isArray(players) ? players.filter(isPlayer) : [];
    if (isDealer) {
      return [...validPlayers].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    }
    return [...validPlayers].sort((a, b) => (b.rebuyTimestamps?.length ?? 0) - (a.rebuyTimestamps?.length ?? 0));
  }, [players, isDealer]);

  if (isLoading) {
    return <PlayerListSkeleton />;
  }

  if (isDealer) {
    if (sortedPlayers.length === 0) {
      return (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No players at the table yet.
        </div>
      );
    }

    return (
      <>
        {/* Mobile: card layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
          {sortedPlayers.map((player) => (
            <DealerPlayerCard
              key={player.id}
              player={player}
              addRebuy={addRebuy}
              removeRebuy={removeRebuy}
              deletePlayer={deletePlayer}
              updateBlackCoins={updateBlackCoins}
              approveRebuy={approveRebuy}
              setHost={setHost}
            />
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="rounded-lg border hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Buy-ins</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-center">#Black Coins</TableHead>
                <TableHead className="text-center">End Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow
                  key={player.id}
                  className={cn(
                    player.hasPendingRebuyRequest && "bg-yellow-100 dark:bg-yellow-900/30"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{player.name}</span>
                      {player.isHost && <Crown className="h-4 w-4 text-amber-500" />}
                      {player.hasPendingRebuyRequest && (
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 animate-pulse">(Requesting Rebuy)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-lg font-bold">
                    <RebuyTooltip timestamps={player.rebuyTimestamps} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {player.hasPendingRebuyRequest ? (
                        <Button
                          size="sm"
                          aria-label={`Approve re-buy for ${player.name}`}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => approveRebuy(player.id)}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Approve
                        </Button>
                      ) : (
                        <ConfirmationDialog
                          title={`Add Re-buy for ${player.name}?`}
                          description="Are you sure you want to manually add a re-buy for this player?"
                          onConfirm={() => addRebuy(player.id)}
                        >
                          <Button variant="ghost" size="icon" aria-label={`Add re-buy for ${player.name}`}>
                            <PlusCircle className="h-5 w-5 text-green-600" />
                          </Button>
                        </ConfirmationDialog>
                      )}
                      <ConfirmationDialog
                        title={`Remove Last Re-buy from ${player.name}?`}
                        description="This will remove the most recent buy-in."
                        onConfirm={() => removeRebuy(player.id)}
                        confirmText="Yes, Remove"
                      >
                        <Button variant="ghost" size="icon" disabled={(player.rebuyTimestamps?.length ?? 0) <= 1}>
                          <MinusCircle className="h-5 w-5" />
                        </Button>
                      </ConfirmationDialog>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setHost(player.id)} disabled={player.isHost}>
                              <Crown className={cn("h-5 w-5", player.isHost ? "text-amber-500" : "text-muted-foreground")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{player.isHost ? "Current host" : "Set as host"}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <ConfirmationDialog
                        title="Delete Player?"
                        description={`Are you sure you want to delete ${player.name}? This action cannot be undone.`}
                        onConfirm={() => deletePlayer(player.id)}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </ConfirmationDialog>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DebouncedCoinInput value={player.blackCoins} onChange={(v) => updateBlackCoins(player.id, v)} />
                  </TableCell>
                  <TableCell className="text-center text-lg font-bold">
                    {parseFloat((player.blackCoins - (player.rebuyTimestamps?.length ?? 0)).toFixed(2))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">Buy-ins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player) => (
              <TableRow
                key={player.id}
                className={cn(player.name === highlightPlayerName && "bg-accent/50")}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {player.name === highlightPlayerName && <User className="h-4 w-4 text-primary" />}
                    <span>{player.name}</span>
                    {player.isHost && <Crown className="h-4 w-4 text-amber-500" />}
                  </div>
                </TableCell>
                <TableCell className="text-center text-lg font-bold">
                  <RebuyTooltip timestamps={player.rebuyTimestamps} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                No players at the table yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
