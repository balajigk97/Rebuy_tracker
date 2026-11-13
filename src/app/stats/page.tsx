'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, ArrowLeft, Loader2, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlayerStats } from '@/lib/types';
import { format } from 'date-fns';

export default function StatsPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const didInitAuth = useRef(false);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (didInitAuth.current) return;
    if (auth && firestore && !user && !isUserLoading) {
      didInitAuth.current = true;
      initiateAnonymousSignIn(auth);
    }
  }, [auth, firestore, user, isUserLoading]);

  useEffect(() => {
    if (!firestore || !user) return;
    const fetchStats = async () => {
      try {
        const q = query(collection(firestore, 'playerStats'), orderBy('totalProfit', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlayerStats[];
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [firestore, user]);

  const totalGames = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.max(...stats.map(s => s.gamesPlayed));
  }, [stats]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          Hall of Fame
        </h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifetime Leaderboard</CardTitle>
          <CardDescription>All-time player stats across all games. Stats are saved when the dealer resets a game.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No stats yet</p>
              <p className="text-sm mt-1">Stats are recorded when the dealer resets a game.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Games</TableHead>
                    <TableHead className="text-center">Total Buy-ins</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s, i) => (
                    <TableRow key={s.id} className={cn(i === 0 && "bg-amber-50 dark:bg-amber-900/10")}>
                      <TableCell className="font-medium">
                        {i === 0 ? (
                          <Trophy className="h-5 w-5 text-amber-500" />
                        ) : i === 1 ? (
                          <Medal className="h-5 w-5 text-gray-400" />
                        ) : i === 2 ? (
                          <Medal className="h-5 w-5 text-amber-700" />
                        ) : (
                          <span className="text-muted-foreground">{i + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell className="text-center">{s.gamesPlayed}</TableCell>
                      <TableCell className="text-center">{s.totalBuyIns}</TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        s.totalProfit > 0 && "text-green-600",
                        s.totalProfit < 0 && "text-destructive",
                      )}>
                        {s.totalProfit > 0 ? '+' : ''}{s.totalProfit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
