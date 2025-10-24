
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { useMemo } from 'react';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import {
  FirebaseProvider,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
import { FirebaseClientProvider } from './client-provider';

// Initialize Firebase
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

let auth: Auth;
let firestore: Firestore;

try {
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} catch (e) {
  console.error('Failed to initialize Firebase services', e);
}

// Custom memoization hook for Firebase queries
const useMemoFirebase = <T>(
  factory: () => T,
  deps: React.DependencyList | undefined
) => {
  const result = useMemo(factory, deps);
  if (result) {
    (result as any).__memo = true;
  }
  return result;
};


export {
  firebaseApp,
  auth,
  firestore,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useMemoFirebase,
};
