/**
 * useAuth hook - Firebase Google Sign-In
 * Provides current user state and sign-in/sign-out methods.
 * Also provides getIdToken() for backend API calls.
 */

import { useState, useEffect, useCallback } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes (persists across refreshes)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            const err = error as { code?: string };
            // Don't log popup-closed-by-user — it's normal
            if (err.code !== 'auth/popup-closed-by-user') {
                console.error('[Auth] Sign-in error:', error);
            }
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('[Auth] Sign-out error:', error);
        }
    }, []);

    const getIdToken = useCallback(async (): Promise<string | null> => {
        if (!auth.currentUser) return null;
        try {
            return await auth.currentUser.getIdToken();
        } catch (error) {
            console.error('[Auth] Token error:', error);
            return null;
        }
    }, []);

    return { user, loading, signInWithGoogle, logout, getIdToken };
}
