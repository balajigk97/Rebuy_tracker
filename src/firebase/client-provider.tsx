
'use client';
import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';

// This provider ensures Firebase is initialized only on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
