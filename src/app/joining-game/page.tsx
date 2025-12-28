'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JoiningGamePage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // If auth state is loaded and there's no user, it means sign-in failed or is not attempted.
        // Redirect to the home page to let the user choose a role.
        if (!isUserLoading && !user) {
            router.replace('/');
        }
        
        // If the user *is* logged in, this page's job is done.
        // However, we don't know where they were trying to go.
        // The auth guard in the layout will handle the redirect back to the intended page.
        // If they land here with a user, we can send them home as a fallback.
        if (!isUserLoading && user) {
             router.replace('/');
        }

    }, [user, isUserLoading, router]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center text-center">
            <h1 className="text-3xl font-bold font-headline">Connecting...</h1>
            <p className="text-muted-foreground mt-2">
                Establishing a secure connection to the game.
            </p>
        </div>
    );
}
