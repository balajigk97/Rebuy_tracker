'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

const PLAYER_NAME_KEY = 'poker_player_name';

function JoinPageContent() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get('table');
  const bgImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  const didInitAuth = useRef(false);

  const [playerName, setPlayerName] = useState('');
  const [savedPlayerName, setSavedPlayerName] = useState<string | null>(null);

  useEffect(() => {
    if (didInitAuth.current) return;
    if (auth && firestore && !user && !isUserLoading) {
      didInitAuth.current = true;
      initiateAnonymousSignIn(auth);
    }
  }, [auth, firestore, user, isUserLoading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY);
      setSavedPlayerName(saved);
      if (saved) setPlayerName(saved);
    } catch {}
  }, []);

  if (!tableId) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        {bgImage && (
          <Image src={bgImage.imageUrl} alt={bgImage.description} fill priority className="object-cover -z-10 brightness-[.25]" />
        )}
        <Card className="bg-card/80 backdrop-blur-sm border-white/20 w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>This join link is missing a table ID. Ask the dealer for a new link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">Go to Home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isUserLoading || !user) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        {bgImage && (
          <Image src={bgImage.imageUrl} alt={bgImage.description} fill priority className="object-cover -z-10 brightness-[.25]" />
        )}
        <div className="text-center text-primary-foreground">
          <h1 className="text-2xl font-bold">Connecting...</h1>
          <p>Initializing your session...</p>
        </div>
      </main>
    );
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (trimmed) {
      try { localStorage.setItem(PLAYER_NAME_KEY, trimmed); } catch {}
      router.push(`/player?table=${encodeURIComponent(tableId)}&name=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleResume = () => {
    if (savedPlayerName) {
      router.push(`/player?table=${encodeURIComponent(tableId)}&name=${encodeURIComponent(savedPlayerName)}`);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {bgImage && (
        <Image src={bgImage.imageUrl} alt={bgImage.description} fill priority className="object-cover -z-10 brightness-[.25]" />
      )}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-headline text-primary-foreground">Rebuy Tracker</h1>
          <p className="text-accent mt-2">
            Joining table: <span className="font-mono font-bold uppercase">{tableId}</span>
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>Enter your name to join the table.</CardDescription>
          </CardHeader>
          <CardContent>
            {savedPlayerName ? (
              <div className="space-y-4 text-center">
                <p className="text-primary-foreground/80">
                  Welcome back, <strong className="font-bold text-accent">{savedPlayerName}</strong>!
                </p>
                <Button onClick={handleResume} className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Resume as {savedPlayerName}
                </Button>
                <Button
                  variant="link"
                  className="w-full text-primary-foreground/60"
                  onClick={() => { setSavedPlayerName(null); setPlayerName(''); try { localStorage.removeItem(PLAYER_NAME_KEY); } catch {} }}
                >
                  Join as someone else
                </Button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-primary-foreground">Player Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                    className="bg-background/80 text-foreground"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!playerName.trim()}>
                  Join Game
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinPageContent />
    </Suspense>
  );
}
