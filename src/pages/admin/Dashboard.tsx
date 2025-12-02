import { useState, useEffect, useCallback } from 'react';
import { orderService, menuService, supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Order {
    id: string;
    order_number?: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
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
    
    const [websiteVisitors] = useState(124); // Mock data as per Vue file

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

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: 'Wartend',
            preparing: 'In Zubereitung',
            ready: 'Bereit',
            delivered: 'Geliefert'
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

    const loadDashboardData = useCallback(async () => {
        try {
            // Load orders for dashboard stats
            const orders = await orderService.getOrders();

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
        
        // Don't reload on tab visibility change - it causes Supabase queries to hang
    }, []);

    return (
        <div className="admin-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
                </div>

                {/* Dashboard Overview */}
                <div>
                    {/* Statistics Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📊</div>
                                <div>
                                    <h3 className="text-lg font-semibold">Bestellungen heute</h3>
                                    <p className="text-2xl font-bold text-amber-600">{todayOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">💰</div>
                                <div>
                                    <h3 className="text-lg font-semibold">Umsatz heute</h3>
                                    <p className="text-2xl font-bold text-green-600">€{todayRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">🍽️</div>
                                <div>
                                    <h3 className="text-lg font-semibold">Menüelemente</h3>
                                    <p className="text-2xl font-bold text-blue-600">{totalMenuItems}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">👥</div>
                                <div>
                                    <h3 className="text-lg font-semibold">Website Besucher</h3>
                                    <p className="text-2xl font-bold text-purple-600">{websiteVisitors}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts and Recent Orders */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-2xl font-bold mb-4">Aktuelle Bestellungen</h2>
                            {recentOrders.length === 0 ? (
                                <div className="text-gray-500">
                                    Keine aktuellen Bestellungen
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{order.customer_name}</p>
                                                <p className="text-sm text-gray-600">€{order.total_amount.toFixed(2)}</p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📈</div>
                                <div>
                                    <h3 className="text-lg font-semibold">Bestellungen Analytics</h3>
                                    <p className="text-2xl font-bold text-blue-600">{orderAnalytics.today}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Heute</span>
                                    <span className="font-medium">{orderAnalytics.today} Bestellungen</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Diese Woche</span>
                                    <span className="font-medium">{orderAnalytics.week} Bestellungen</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Diesen Monat</span>
                                    <span className="font-medium">{orderAnalytics.month} Bestellungen</span>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        📊 Durchschnitt: {orderAnalytics.avgPerDay.toFixed(1)} Bestellungen/Tag
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
