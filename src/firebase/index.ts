
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
    if (getApps().length) {
      return getSdks(getApp());
    }
  
    // In a production environment, App Hosting provides the configuration via
    // environment variables.
    if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
        try {
            const prodConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
            const firebaseApp = initializeApp(prodConfig);
            return getSdks(firebaseApp);
        } catch (e) {
            console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG", e);
        }
    }
    
    // During development, use the local config file.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
