'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JoiningGamePage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // If auth state is still loading, do nothing and wait.
        if (isUserLoading) {
            return;
        }
        
        // Once loading is complete, if there's a user, they are authenticated.
        // Redirect them back to the home page to select their role again.
        if (user) {
             router.replace('/');
        } else {
        // If there's no user, something is wrong with the sign-in process.
        // Send them home to restart the flow.
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
