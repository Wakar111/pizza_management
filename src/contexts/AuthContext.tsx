import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData?: any) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnce = useRef(false);

    const checkAdminStatus = useCallback(async (userId: string) => {
        console.log('[Auth] Checking admin status for user:', userId);
        
        try {
            // Check user_profiles table for role
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (!profileError && profile) {
                const isAdminUser = profile.role === 'admin';
                setIsAdmin(isAdminUser);
                console.log('[Auth] User role from profile:', profile.role, 'isAdmin:', isAdminUser);
                return isAdminUser;
            }

            // No profile found or error
            console.log('[Auth] No profile found or error:', profileError);
            setIsAdmin(false);
            return false;
        } catch (err) {
            console.error('[Auth] Error checking admin status:', err);
            setIsAdmin(false);
            return false;
        }
    }, []);

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

    useEffect(() => {
        // Only initialize once
        if (hasLoadedOnce.current) {
            console.log('[Auth] Already initialized, skipping');
            return;
        }

        console.log('[Auth] Starting initialization...');

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user as User);
                    console.log('[Auth] Session found, checking admin status...');
                    await checkAdminStatus(session.user.id);
                    console.log('[Auth] Admin status check complete');
                } else {
                    console.log('[Auth] No session found');
                }

                // Auth state change listener - only for sign out
                const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string) => {
                    console.log('[Auth] Auth state changed:', event);
                    
                    // Only handle SIGNED_OUT - ignore all other events to prevent breaking Supabase
                    if (event === 'SIGNED_OUT') {
                        console.log('[Auth] User signed out, clearing state');
                        setUser(null);
                        setIsAdmin(false);
                    } else {
                        console.log('[Auth] Ignoring event:', event, '- already initialized');
                    }
                });
                
                // Cleanup listener on unmount
                return () => {
                    authListener?.subscription.unsubscribe();
                };

                console.log('[Auth] Initialization complete');
            } catch (error) {
                console.error('[Auth] Initialization error:', error);
            } finally {
                // Only set loading to false once
                setLoading(false);
                hasLoadedOnce.current = true;
                console.log('[Auth] Loading set to false (first time)');
            }
        };

        initializeAuth();
    }, []); // Empty dependencies - only run once

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
