import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase, orderService } from '../lib/supabase';

export default function Layout() {
    const { user, isAdmin, signOut } = useAuth();
    const { totalItems, clearCart } = useCart();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    
    // Admin notification state
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [notificationInterval, setNotificationInterval] = useState<NodeJS.Timeout | null>(null);

    const handleSignOut = async () => {
        try {
            await signOut();
            clearCart();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                mobileMenuOpen &&
                mobileMenuRef.current &&
                menuButtonRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                !menuButtonRef.current.contains(event.target as Node)
            ) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileMenuOpen]);

    // Admin notification system - works from any page
    useEffect(() => {
        if (!isAdmin) return;

        // Load initial pending orders count
        const loadPendingCount = async () => {
            try {
                const orders = await orderService.getOrders();
                const pending = orders.filter((o: any) => o.status === 'awaiting_confirmation').length;
                setPendingOrdersCount(pending);
            } catch (err) {
                console.error('Error loading pending orders:', err);
            }
        };

        loadPendingCount();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Set up real-time subscription
        const ordersSubscription = supabase
            .channel('admin-orders-notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload: any) => {
                    console.log('[Layout] Order change:', payload);

                    // Stop sound when order is updated or deleted
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                        const newStatus = payload.new?.status;
                        if (newStatus === 'cancelled' || newStatus === 'pending' || payload.eventType === 'DELETE') {
                            if (notificationInterval) {
                                clearInterval(notificationInterval);
                                setNotificationInterval(null);
                            }
                        }
                    }

                    // Play sound and show notification for new orders
                    if (payload.eventType === 'INSERT') {
                        const playNotificationSound = () => {
                            try {
                                let volume1 = 0.6, volume2 = 0.6, volume3 = 0.7;
                                let freq1 = 880, freq2 = 1046, freq3 = 1318;
                                let waveType: OscillatorType = 'sine';

                                try {
                                    const saved = localStorage.getItem('notification_sound_settings');
                                    if (saved) {
                                        const settings = JSON.parse(saved);
                                        volume1 = settings.volume1 || 0.6;
                                        volume2 = settings.volume2 || 0.6;
                                        volume3 = settings.volume3 || 0.7;
                                        freq1 = settings.freq1 || 880;
                                        freq2 = settings.freq2 || 1046;
                                        freq3 = settings.freq3 || 1318;
                                        waveType = settings.waveType || 'sine';
                                    }
                                } catch (e) {
                                    console.log('Using default notification settings');
                                }

                                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                                // First beep
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();
                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                                oscillator.frequency.value = freq1;
                                oscillator.type = waveType;
                                gainNode.gain.setValueAtTime(volume1, audioContext.currentTime);
                                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                                oscillator.start(audioContext.currentTime);
                                oscillator.stop(audioContext.currentTime + 0.15);

                                // Second beep
                                const oscillator2 = audioContext.createOscillator();
                                const gainNode2 = audioContext.createGain();
                                oscillator2.connect(gainNode2);
                                gainNode2.connect(audioContext.destination);
                                oscillator2.frequency.value = freq2;
                                oscillator2.type = waveType;
                                gainNode2.gain.setValueAtTime(volume2, audioContext.currentTime + 0.2);
                                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
                                oscillator2.start(audioContext.currentTime + 0.2);
                                oscillator2.stop(audioContext.currentTime + 0.35);

                                // Third beep
                                const oscillator3 = audioContext.createOscillator();
                                const gainNode3 = audioContext.createGain();
                                oscillator3.connect(gainNode3);
                                gainNode3.connect(audioContext.destination);
                                oscillator3.frequency.value = freq3;
                                oscillator3.type = waveType;
                                gainNode3.gain.setValueAtTime(volume3, audioContext.currentTime + 0.4);
                                gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                                oscillator3.start(audioContext.currentTime + 0.4);
                                oscillator3.stop(audioContext.currentTime + 0.6);
                            } catch (e) {
                                console.log('Audio play failed:', e);
                            }
                        };

                        // Play immediately
                        playNotificationSound();

                        // Clear existing interval
                        if (notificationInterval) {
                            clearInterval(notificationInterval);
                        }

                        // Get repeat interval from localStorage
                        let repeatInterval = 3000;
                        try {
                            const saved = localStorage.getItem('notification_sound_settings');
                            if (saved) {
                                const settings = JSON.parse(saved);
                                repeatInterval = settings.interval || 3000;
                            }
                        } catch (e) {
                            console.log('Using default repeat interval');
                        }

                        // Set up repeating sound
                        const interval = setInterval(() => {
                            playNotificationSound();
                        }, repeatInterval);

                        setNotificationInterval(interval);

                        // Show browser notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('🔔 Neue Bestellung!', {
                                body: 'Eine neue Bestellung wartet auf Bestätigung.',
                                tag: 'new-order',
                                requireInteraction: true
                            });
                        }
                    }

                    // Reload pending count
                    loadPendingCount();
                }
            )
            .subscribe();

        return () => {
            ordersSubscription.unsubscribe();
            if (notificationInterval) {
                clearInterval(notificationInterval);
            }
        };
    }, [isAdmin, notificationInterval]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <img src="/crusty-logo.png" alt="Pizza Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    Crusty Pizza
                                </div>
                                <div className="hidden md:block text-xs text-gray-500 -mt-1">Estd 2012</div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {isAdmin ? (
                                <>
                                    <Link
                                        to="/admin"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group flex items-center gap-2"
                                    >
                                        Dashboard
                                        {pendingOrdersCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                {pendingOrdersCount}
                                            </span>
                                        )}
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/menu"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Menü
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/orders"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Bestellungen
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/settings"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Einstellungen
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/stammkunden"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        👥
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/abrechnungen"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        📊
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Home
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/menu"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Menü
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/user/info"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Info
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/cart"
                                        className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
                                    >
                                        <div className="relative">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                                            </svg>
                                            {totalItems > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                                                    {totalItems}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Auth Section */}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-3">
                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-2 py-1.5 md:px-4 md:py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        >
                                            <span className="flex items-center space-x-1 md:space-x-2">
                                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>Admin</span>
                                            </span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleSignOut}
                                        className="hidden md:block text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                                        title="Abmelden"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-3 py-1.5 md:px-6 md:py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    Anmelden
                                </Link>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                ref={menuButtonRef}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div ref={mobileMenuRef} className="md:hidden py-4 border-t border-gray-100">
                            <div className="flex flex-col space-y-2">
                                {isAdmin ? (
                                    <>
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
                                        >
                                            <span>Dashboard</span>
                                            {pendingOrdersCount > 0 && (
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    {pendingOrdersCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            to="/admin/menu"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Menü
                                        </Link>
                                        <Link
                                            to="/admin/orders"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Bestellungen
                                        </Link>
                                        <Link
                                            to="/admin/settings"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Einstellungen
                                        </Link>
                                        <Link
                                            to="/admin/stammkunden"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Stammkunden 👥
                                        </Link>
                                        <Link
                                            to="/admin/abrechnungen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Abrechnungen 📊
                                        </Link>
                                        {user && (
                                            <button
                                                onClick={() => {
                                                    handleSignOut();
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mt-2 border-t border-gray-200"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Abmelden</span>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Home
                                        </Link>
                                        <Link
                                            to="/menu"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Menü
                                        </Link>
                                        <Link
                                            to="/user/info"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Info
                                        </Link>
                                        <Link
                                            to="/cart"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
                                        >
                                            <span>Warenkorb</span>
                                            {totalItems > 0 && (
                                                <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {totalItems}
                                                </span>
                                            )}
                                        </Link>
                                        {user && (
                                            <button
                                                onClick={() => {
                                                    handleSignOut();
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mt-2 border-t border-gray-200"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Abmelden</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="min-h-screen pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-100">© 2024 Crusty Pizza. Alle Rechte vorbehalten.</p>

                        {/* Developer Credit */}
                        <div className="text-gray-200 text-sm">
                            Developed by{' '}
                            <a
                                href="https://innovativ-tech.de/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-gray-100 transition-colors font-medium underline"
                            >
                                Innovative-Tech
                            </a>
                        </div>

                        <div className="flex space-x-6">
                            <Link to="/user/agb" className="text-gray-100 hover:text-white transition-colors">
                                AGB
                            </Link>
                            <Link to="/user/datenschutz" className="text-gray-100 hover:text-white transition-colors">
                                Datenschutz
                            </Link>
                            <Link to="/user/impressum" className="text-gray-100 hover:text-white transition-colors">
                                Impressum
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
