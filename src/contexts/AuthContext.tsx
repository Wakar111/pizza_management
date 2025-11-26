import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData?: any) => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const checkAdminStatus = async (userId: string) => {
        if (isCheckingAdmin) {
            console.log('[Auth] Already checking admin status, skipping');
            return;
        }

        setIsCheckingAdmin(true);

        try {
            // Check user_profiles table for role
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (!profileError && profile) {
                setIsAdmin(profile.role === 'admin');
                console.log('[Auth] User role from profile:', profile.role);
                return;
            }

            // Fallback to admin_users table
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', userId)
                .single();

            setIsAdmin(!error && !!data);
            console.log('[Auth] Admin status from admin_users table:', !error && !!data);
        } catch (err) {
            console.error('[Auth] Error checking admin status:', err);
            setIsAdmin(false);
        } finally {
            setIsCheckingAdmin(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (data.user) {
            setUser(data.user as User);
            await checkAdminStatus(data.user.id);
        }
    };

    const signUp = async (email: string, password: string, userData: any = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });

        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        try {
            console.log('[Auth] Signing out user...');
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[Auth] Supabase signOut error:', error);
                throw error;
            }

            console.log('[Auth] Supabase signOut successful');
        } catch (error) {
            console.error('[Auth] Error during signOut:', error);
        } finally {
            setUser(null);
            setIsAdmin(false);
            console.log('[Auth] Local state cleared');
        }
    };

    const initialize = async () => {
        if (isInitialized) {
            console.log('[Auth] Already initialized, skipping');
            return;
        }

        console.log('[Auth] Starting initialization...');

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user as User);
                console.log('[Auth] Session found, checking admin status...');
                await checkAdminStatus(session.user.id);
            } else {
                console.log('[Auth] No session found');
            }

            // Auth state change listener
            supabase.auth.onAuthStateChange(async (event: string, session: any) => {
                console.log('[Auth] Auth state changed:', event);
                if (session?.user) {
                    setUser(session.user as User);
                    await checkAdminStatus(session.user.id);
                } else {
                    setUser(null);
                    setIsAdmin(false);
                }
            });

            setIsInitialized(true);
            console.log('[Auth] Initialization complete');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut, initialize }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
