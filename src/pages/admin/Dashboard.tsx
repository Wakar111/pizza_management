import { useState, useEffect, useCallback } from 'react';
import { orderService, menuService } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import OrderConfirmationCard from '../../components/OrderConfirmationCard';

interface Order {
    id: string;
    order_number?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    total_amount: number;
    status: string;
    created_at: string;
    order_type?: 'delivery' | 'pickup';
    notes?: string;
}

interface OrderAnalytics {
    today: number;
    week: number;
    month: number;
    avgPerDay: number;
}

export default function Dashboard() {
    // Initialize from localStorage
    const [todayOrders, setTodayOrders] = useState(() => {
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.todayOrders || 0;
            }
        } catch (err) {
            console.error('[Dashboard] Error loading from localStorage:', err);
        }
        return 0;
    });
    
    const [todayRevenue, setTodayRevenue] = useState(() => {
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.todayRevenue || 0;
            }
        } catch (err) {}
        return 0;
    });
    
    const [totalMenuItems, setTotalMenuItems] = useState(() => {
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.totalMenuItems || 0;
            }
        } catch (err) {}
        return 0;
    });
    
    const [recentOrders, setRecentOrders] = useState<Order[]>(() => {
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.recentOrders || [];
            }
        } catch (err) {}
        return [];
    });
    
    // Order Analytics
    const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics>(() => {
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.orderAnalytics || { today: 0, week: 0, month: 0, avgPerDay: 0 };
            }
        } catch (err) {}
        return { today: 0, week: 0, month: 0, avgPerDay: 0 };
    });
    const [notificationInterval, setNotificationInterval] = useState<NodeJS.Timeout | null>(null);

    // Chart state
    const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');
    const [chartData, setChartData] = useState<{ label: string; count: number }[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>(() => {
        // Try to load all orders from localStorage
        try {
            const cached = localStorage.getItem('admin_dashboard');
            if (cached) {
                const data = JSON.parse(cached);
                return data.allOrders || [];
            }
        } catch (err) {}
        return [];
    });

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            awaiting_confirmation: 'Wartet auf Bestätigung',
            pending: 'Wartend',
            preparing: 'In Zubereitung',
            ready: 'Bereit',
            delivered: 'Geliefert',
            cancelled: 'Abgelehnt'
        };
        return statusMap[status] || status;
    };

    // Load menu items count for dashboard
    const loadMenuItemsCount = useCallback(async () => {
        try {
            const items = await menuService.getMenuItems();
            setTotalMenuItems(items.length);
        } catch (error) {
            console.error('Error loading menu items count:', error);
            setTotalMenuItems(0);
        }
    }, []);

    // Calculate chart data based on period
    const calculateChartData = useCallback((orders: any[]) => {
        const now = new Date();
        const data: { label: string; count: number }[] = [];

        if (chartPeriod === 'week') {
            // Last 7 days
            const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const count = orders.filter((order: any) => {
                    const orderDate = new Date(order.created_at);
                    return orderDate >= dayStart && orderDate < dayEnd;
                }).length;

                data.push({
                    label: dayNames[date.getDay()],
                    count
                });
            }
        } else {
            // Last 30 days grouped by week
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 7);

                const count = orders.filter((order: any) => {
                    const orderDate = new Date(order.created_at);
                    return orderDate >= weekStart && orderDate < weekEnd;
                }).length;

                const weekLabel = i === 0 ? 'Diese Woche' : `Vor ${i} Woche${i > 1 ? 'n' : ''}`;
                data.push({
                    label: weekLabel,
                    count
                });
            }
        }

        setChartData(data);
    }, [chartPeriod]);

    const loadDashboardData = useCallback(async () => {
        try {
            console.log('[Dashboard] Loading dashboard data...');
            // Load orders for dashboard stats
            const orders = await orderService.getOrders();
            console.log(`[Dashboard] Loaded ${orders.length} orders`);

            // Get current date in local timezone (start of day)
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);

            // Filter orders by date ranges (converting UTC to local time)
            const todayOrdersList = orders.filter((order: any) => {
                const orderDate = new Date(order.created_at); // This converts UTC to local time
                const orderLocalDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return orderLocalDate.getTime() === todayLocal.getTime();
            });

            const weekOrdersList = orders.filter((order: any) => {
                const orderDate = new Date(order.created_at);
                return orderDate >= weekAgo;
            });

            const monthOrdersList = orders.filter((order: any) => {
                const orderDate = new Date(order.created_at);
                return orderDate >= monthAgo;
            });

            // Update dashboard stats
            const dashboardData = {
                todayOrders: todayOrdersList.length,
                todayRevenue: todayOrdersList.reduce((sum: number, order: any) => sum + order.total_amount, 0),
                recentOrders: orders.slice(0, 5),
                allOrders: orders, // Store all orders for chart
                orderAnalytics: {
                    today: todayOrdersList.length,
                    week: weekOrdersList.length,
                    month: monthOrdersList.length,
                    avgPerDay: monthOrdersList.length > 0 ? monthOrdersList.length / 30 : 0
                }
            };
            
            setTodayOrders(dashboardData.todayOrders);
            setTodayRevenue(dashboardData.todayRevenue);
            setRecentOrders(dashboardData.recentOrders);
            setOrderAnalytics(dashboardData.orderAnalytics);
            
            // Store all orders for chart recalculation
            setAllOrders(orders);
            
            // Save to localStorage
            try {
                localStorage.setItem('admin_dashboard', JSON.stringify(dashboardData));
            } catch (err) {
                console.error('[Dashboard] Error saving to localStorage:', err);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Use mock data on error
            setTodayOrders(12);
            setTodayRevenue(245.80);
            setOrderAnalytics({
                today: 12,
                week: 45,
                month: 156,
                avgPerDay: 5.2
            });
            setRecentOrders([
                {
                    id: '1',
                    customer_name: 'Max Mustermann',
                    total_amount: 23.50,
                    status: 'preparing',
                    created_at: new Date().toISOString()
                },
                {
                    id: '2',
                    customer_name: 'Anna Schmidt',
                    total_amount: 18.90,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            ]);
        }
    }, []);

    useEffect(() => {
        // Load data immediately on mount
        loadDashboardData();
        loadMenuItemsCount();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Set up real-time subscription for orders
        const ordersSubscription = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'orders'
                },
                (payload: any) => {
                    console.log('[Dashboard] Real-time order change:', payload);
                    
                    // Stop notification sound when order is cancelled (declined), confirmed, or deleted
                    if (payload.eventType === 'UPDATE') {
                        const newStatus = payload.new?.status;
                        if (newStatus === 'cancelled' || newStatus === 'pending') {
                            if (notificationInterval) {
                                clearInterval(notificationInterval);
                                setNotificationInterval(null);
                                console.log('🔇 Notification sound stopped (order status changed)');
                            }
                        }
                    }
                    
                    // Also stop sound when order is deleted
                    if (payload.eventType === 'DELETE') {
                        if (notificationInterval) {
                            clearInterval(notificationInterval);
                            setNotificationInterval(null);
                            console.log('🔇 Notification sound stopped (order deleted)');
                        }
                    }
                    
                    // Play notification sound for new orders
                    if (payload.eventType === 'INSERT') {
                        // Function to play notification sound
                        const playNotificationSound = () => {
                            try {
                                // Get settings from localStorage (set by admin in Settings page) with defaults
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
                                
                                console.log('🔊 Notification sound played');
                            } catch (e) {
                                console.log('Audio play failed:', e);
                            }
                        };
                        
                        // Play sound immediately
                        playNotificationSound();
                        
                        // Clear any existing interval
                        if (notificationInterval) {
                            clearInterval(notificationInterval);
                        }
                        
                        // Get repeat interval from localStorage (default: 3000ms = 3 seconds)
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
                        
                        // Set up interval to play sound repeatedly
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
                    
                    // Reload dashboard data when orders change
                    loadDashboardData();
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            ordersSubscription.unsubscribe();
            // Clear notification interval if exists
            if (notificationInterval) {
                clearInterval(notificationInterval);
            }
        };
    }, [loadDashboardData, notificationInterval]);

    // Recalculate chart data when period or orders change
    useEffect(() => {
        if (allOrders.length > 0) {
            calculateChartData(allOrders);
        } else {
            // Show empty chart
            setChartData([]);
        }
    }, [chartPeriod, allOrders, calculateChartData]);

    return (
        <div className="admin-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Admin Dashboard</h1>
                </div>

                {/* Dashboard Overview */}
                <div>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">📊</div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Bestellungen heute</h3>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-600">{todayOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">💰</div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Umsatz heute</h3>
                                    <p className="text-xl sm:text-2xl font-bold text-green-600">€{todayRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">🍽️</div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Menüelemente</h3>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalMenuItems}</p>
                                </div>
                            </div>
                        </div>

                        <a 
                            href="/admin/abrechnungen"
                            className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block"
                        >
                            <div className="flex items-center">
                                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">📊</div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Abrechnungen</h3>
                                    <p className="text-sm text-gray-500">Finanzübersicht anzeigen</p>
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* Pending Confirmations and Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                                <span>⏰ Bestellungen bestätigen</span>
                                {recentOrders.filter(o => o.status === 'awaiting_confirmation').length > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {recentOrders.filter(o => o.status === 'awaiting_confirmation').length}
                                    </span>
                                )}
                            </h2>
                            {recentOrders.filter(o => o.status === 'awaiting_confirmation').length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">✅</div>
                                    <p>Keine Bestellungen warten auf Bestätigung</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                    {recentOrders
                                        .filter(o => o.status === 'awaiting_confirmation')
                                        .map((order) => (
                                            <OrderConfirmationCard
                                                key={order.id}
                                                order={order}
                                                onConfirmed={() => {
                                                    // Stop notification sound
                                                    if (notificationInterval) {
                                                        clearInterval(notificationInterval);
                                                        setNotificationInterval(null);
                                                    }
                                                    // Reload orders after confirmation
                                                    loadDashboardData();
                                                }}
                                                onDeclined={() => {
                                                    // Stop notification sound
                                                    if (notificationInterval) {
                                                        clearInterval(notificationInterval);
                                                        setNotificationInterval(null);
                                                    }
                                                    // Reload orders after decline
                                                    loadDashboardData();
                                                }}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="text-3xl mr-4">📈</div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Bestellungen Analytics</h3>
                                        <p className="text-sm text-gray-500">Bestellungen pro Tag</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setChartPeriod('week')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            chartPeriod === 'week'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Diese Woche
                                    </button>
                                    <button
                                        onClick={() => setChartPeriod('month')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            chartPeriod === 'month'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Monat
                                    </button>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Heute</span>
                                    <span className="font-medium">{orderAnalytics.today} Bestellungen</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Diese Woche</span>
                                    <span className="font-medium">{orderAnalytics.week} Bestellungen</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Diesen Monat</span>
                                    <span className="font-medium">{orderAnalytics.month} Bestellungen</span>
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        📊 Durchschnitt: {orderAnalytics.avgPerDay.toFixed(1)} Bestellungen/Tag
                                    </p>
                                </div>
                            </div>
                            
                            {/* Bar Chart */}
                            <div className="h-80 flex items-end justify-between gap-2">
                                {chartData.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        Keine Daten verfügbar
                                    </div>
                                ) : chartData.map((item, index) => {
                                    const maxOrders = Math.max(...chartData.map(d => d.count), 1);
                                    const heightPercent = (item.count / maxOrders) * 100;
                                    const heightPx = (heightPercent / 100) * 256; // 256px = h-64
                                    
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full flex flex-col items-end justify-end h-64">
                                                <div
                                                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-300 hover:from-primary-600 hover:to-primary-500 cursor-pointer relative group"
                                                    style={{ 
                                                        height: `${Math.max(heightPx, 10)}px`,
                                                        minHeight: item.count > 0 ? '20px' : '5px'
                                                    }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {item.count} Bestellung{item.count !== 1 ? 'en' : ''}
                                                    </div>
                                                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                                                        {item.count}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-600 font-medium text-center">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Summary */}
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Gesamt</p>
                                        <p className="text-lg font-bold text-primary-600">
                                            {chartData.reduce((sum, item) => sum + item.count, 0)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Durchschnitt</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {(chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length).toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Höchster Tag</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {Math.max(...chartData.map(d => d.count))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
