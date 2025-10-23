
"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, UserCog } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role");
  const name = searchParams.get("name");
  const auth = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0][0];
  }

  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"></rect><path d="M215.4,85.1A32.4,32.4,0,0,0,192,80H151.2L128,42.6,104.8,80H64a32.4,32.4,0,0,0-23.4,5.1,31.5,31.5,0,0,0-5.5,45.2L88,213.3a8,8,0,0,0,14.4-4.2L86.2,160h83.6l-16.2,49.1a8,8,0,0,0,14.4,4.2l52.9-83A31.5,31.5,0,0,0,215.4,85.1Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12"></path></svg>
          <span className="text-xl font-bold font-headline">Rebuy Tracker</span>
        </Link>
        <div className="flex items-center gap-4">
          {role === 'dealer' && user ? (
            <>
              <div className="flex items-center gap-2">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">{user.displayName}</span>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : role === 'player' ? (
             <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Player: {name}</span>
            </div>
          ) : null }
           {role === 'player' && (
             <Button asChild variant="outline" size="sm">
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit
                </Link>
            </Button>
           )}
        </div>
      </div>
    </header>
  );
}

