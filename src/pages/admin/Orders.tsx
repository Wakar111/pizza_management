import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { orderService } from '../../lib/supabase';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

interface OrderItem {
    id: string;
    menu_items: {
        name: string;
        price: number;
    };
    quantity: number;
    size_name?: string;
    size_price?: number;
    order_item_extras?: {
        extra_name: string;
        extra_price: number;
    }[];
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_address: string;
    notes?: string;
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    order_items: OrderItem[];
}

export default function Orders() {
    // Initialize from localStorage
    const [orders, setOrders] = useState<Order[]>(() => {
        try {
            const cached = localStorage.getItem('admin_orders');
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('[AdminOrders] Error loading from localStorage:', err);
        }
        return [];
    });

    const [loading, setLoading] = useState(() => {
        try {
            const cached = localStorage.getItem('admin_orders');
            return !cached; // Only show loading if no cache
        } catch {
            return false;
        }
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateFilter, setDateFilter] = useState('week');
    const loadingRef = useRef(false);

    // Confirm Dialog State
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    }, []);

    // Wrap loadOrders with useCallback
    const loadOrders = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (loadingRef.current) {
            console.log('[AdminOrders] Already loading, skipping...');
            return;
        }

        loadingRef.current = true;
        setLoading(true);

        try {
            const data = await orderService.getOrders();
            setOrders(data);
            // Save to localStorage
            try {
                localStorage.setItem('admin_orders', JSON.stringify(data));
            } catch (err) {
                console.error('[AdminOrders] Error saving to localStorage:', err);
            }
        } catch (error: any) {
            console.error('[AdminOrders] Error loading orders:', error);
            setToastMessage('Fehler beim Laden der Bestellungen: ' + error.message);
            setToastType('error');
            setShowToast(true);
            setOrders([]); // Set empty array on error
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);


    useEffect(() => {
        // Load data immediately on mount
        loadOrders();

        // Don't reload on tab visibility change - it causes Supabase queries to hang
    }, []);

    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(order => order.status === filterStatus);
        }

        // Filter by date
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);

                if (dateFilter === 'today') {
                    return orderDate.toDateString() === now.toDateString();
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    return orderDate >= weekAgo;
                } else if (dateFilter === 'month') {
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(now.getMonth() - 1);
                    return orderDate >= monthAgo;
                }

                return true;
            });
        }

        return filtered;
    }, [orders, filterStatus, dateFilter]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            const updatedOrders = orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            );
            setOrders(updatedOrders);
            // Update localStorage to persist the change
            try {
                localStorage.setItem('admin_orders', JSON.stringify(updatedOrders));
            } catch (err) {
                console.error('[AdminOrders] Error updating localStorage:', err);
            }
            showNotification(`Status auf "${getStatusText(newStatus)}" aktualisiert`, 'success');
        } catch (error: any) {
            console.error('[AdminOrders] Error updating status:', error);
            showNotification('Fehler beim Aktualisieren des Status: ' + error.message, 'error');
        }
    };

    const confirmDelete = (orderId: string) => {
        setOrderToDelete(orderId);
        setShowConfirmDialog(true);
    };

    const deleteOrder = async () => {
        if (!orderToDelete) return;

        try {
            await orderService.deleteOrder(orderToDelete);
            setOrders(prev => prev.filter(order => order.id !== orderToDelete));
            showNotification('Bestellung erfolgreich gelöscht', 'success');
        } catch (error: any) {
            console.error('[AdminOrders] Error deleting order:', error);
            showNotification('Fehler beim Löschen der Bestellung: ' + error.message, 'error');
        } finally {
            setShowConfirmDialog(false);
            setOrderToDelete(null);
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: 'Wartend',
            preparing: 'In Zubereitung',
            ready: 'Bereit zur Lieferung',
            delivered: 'Geliefert',
            cancelled: 'Storniert'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            preparing: 'bg-blue-100 text-blue-800 border-blue-200',
            ready: 'bg-purple-100 text-purple-800 border-purple-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    return (
        <div className="admin-orders-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center gap-4 mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Bestellungen</h1>
                    <button
                        onClick={loadOrders}
                        className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 transition-colors"
                        title="Aktualisieren"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Status Filter Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                        {[
                            { id: 'all', label: 'Alle' },
                            { id: 'pending', label: 'Wartend' },
                            { id: 'preparing', label: 'In Zubereitung' },
                            { id: 'ready', label: 'Bereit' },
                            { id: 'delivered', label: 'Geliefert' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-medium transition-colors ${filterStatus === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {tab.label}
                                <span className="ml-1 sm:ml-2 text-xs opacity-75 bg-black bg-opacity-10 px-1.5 py-0.5 rounded-full">
                                    {tab.id === 'all'
                                        ? orders.length
                                        : orders.filter(o => o.status === tab.id).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Zeitraum:</span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex-1 sm:flex-none"
                        >
                            <option value="all">Alle</option>
                            <option value="today">Heute</option>
                            <option value="week">Diese Woche</option>
                            <option value="month">Dieser Monat</option>
                        </select>
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="mt-4 text-gray-600">Lade Bestellungen...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-medium text-gray-900">Keine Bestellungen gefunden</h3>
                        <p className="text-gray-500 mt-2">
                            {filterStatus === 'all'
                                ? 'Es liegen noch keine Bestellungen vor.'
                                : `Keine Bestellungen mit Status "${getStatusText(filterStatus)}".`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                        <span className="font-mono text-sm sm:text-base font-bold text-gray-500">#{String(order.id).substring(0, 8)}</span>
                                        <span className="text-sm text-gray-500 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatDate(order.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 rounded-lg border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none cursor-pointer flex-1 sm:flex-none ${getStatusColor(order.status)}`}
                                        >
                                            <option value="pending">Wartend</option>
                                            <option value="preparing">In Zubereitung</option>
                                            <option value="ready">Bereit zur Lieferung</option>
                                            <option value="delivered">Geliefert</option>
                                            <option value="cancelled">Storniert</option>
                                        </select>
                                        <button
                                            onClick={() => confirmDelete(order.id)}
                                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                            title="Bestellung löschen"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Order Content */}
                                <div className="p-4 sm:p-6 grid md:grid-cols-2 gap-6 md:gap-8">
                                    {/* Customer Details */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Kunde</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-start">
                                                <div className="w-8 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <div className="w-8 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <a href={`tel:${order.customer_phone}`} className="text-primary-600 hover:underline">
                                                        {order.customer_phone}
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <div className="w-8 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-gray-900">{order.customer_address}</p>
                                                    <a
                                                        href={`https://maps.google.com/?q=${encodeURIComponent(order.customer_address)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                                                    >
                                                        Auf Karte anzeigen
                                                    </a>
                                                </div>
                                            </div>
                                            {order.notes && (
                                                <div className="flex items-start bg-yellow-50 p-3 rounded-lg mt-2">
                                                    <div className="w-8 text-yellow-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-yellow-800 font-medium">Hinweis:</p>
                                                        <p className="text-sm text-yellow-700">{order.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Bestellung</h4>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            {order.order_items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-start text-sm">
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline">
                                                            <span className="font-bold mr-2">{item.quantity}x</span>
                                                            <span className="font-medium text-gray-900">{item.menu_items.name}</span>
                                                        </div>
                                                        {item.size_name && (
                                                            <div className="text-gray-500 text-xs ml-6">Größe: {item.size_name}</div>
                                                        )}
                                                        {item.order_item_extras && item.order_item_extras.length > 0 && (
                                                            <div className="text-gray-500 text-xs ml-6">
                                                                + {item.order_item_extras.map(e => e.extra_name).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="font-medium text-gray-900">
                                                        €{((item.size_price || item.menu_items.price) * item.quantity +
                                                            (item.order_item_extras?.reduce((sum, e) => sum + e.extra_price, 0) || 0) * item.quantity
                                                        ).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="border-t border-gray-200 my-3 pt-3 space-y-2">
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Zwischensumme</span>
                                                    <span>€{(order.subtotal || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Liefergebühr</span>
                                                    <span>€{(order.delivery_fee || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Zahlungsart</span>
                                                    <span className="font-medium">
                                                        {order.payment_method === 'cash' ? 'Barzahlung' : 'Online Bezahlt'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                                                    <span>Gesamtbetrag</span>
                                                    <span>€{(order.total_amount || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmDialog
                    show={showConfirmDialog}
                    title="Bestellung löschen"
                    message="Sind Sie sicher, dass Sie diese Bestellung unwiderruflich löschen möchten?"
                    confirmText="Löschen"
                    type="danger"
                    onConfirm={deleteOrder}
                    onCancel={() => setShowConfirmDialog(false)}
                />

                <Toast
                    show={showToast}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            </div>
        </div>
    );
}
