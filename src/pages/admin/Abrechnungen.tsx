import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../lib/supabase';
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

type DateFilterType = 'today' | 'week' | 'month' | 'last-month' | 'all' | 'custom';

export default function Abrechnungen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getOrders();
            setOrders(data);
        } catch (error: any) {
            console.error('[Abrechnungen] Error loading orders:', error);
            showNotification('Fehler beim Laden der Bestellungen: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        const now = new Date();

        if (dateFilter === 'today') {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.toDateString() === now.toDateString();
            });
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= weekAgo;
            });
        } else if (dateFilter === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= monthStart;
            });
        } else if (dateFilter === 'last-month') {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
            });
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        // Filter by search query (order number)
        if (searchQuery.trim()) {
            filtered = filtered.filter(order =>
                String(order.id).toLowerCase().includes(searchQuery.toLowerCase().trim())
            );
        }

        return filtered;
    }, [orders, dateFilter, customStartDate, customEndDate, searchQuery]);

    const totals = useMemo(() => {
        const cashOrders = filteredOrders.filter(o => o.payment_method === 'cash');
        const onlineOrders = filteredOrders.filter(o => o.payment_method !== 'cash');

        return {
            total: filteredOrders.reduce((sum, order) => sum + order.total_amount, 0),
            cash: cashOrders.reduce((sum, order) => sum + order.total_amount, 0),
            online: onlineOrders.reduce((sum, order) => sum + order.total_amount, 0),
            count: filteredOrders.length,
            cashCount: cashOrders.length,
            onlineCount: onlineOrders.length
        };
    }, [filteredOrders]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const exportToCSV = () => {
        const headers = ['Bestellnummer', 'Datum', 'Kunde', 'Zahlungsart', 'Artikel', 'Menge', 'Größe', 'Extras', 'Preis (€)', 'Zwischensumme (€)', 'Liefergebühr (€)', 'Gesamtbetrag (€)'];
        const rows: string[][] = [];

        filteredOrders.forEach(order => {
            const orderBasics = [
                order.id,
                formatDate(order.created_at),
                order.customer_name,
                order.payment_method === 'cash' ? 'Barzahlung' : 'Online Bezahlt'
            ];

            if (order.order_items && order.order_items.length > 0) {
                order.order_items.forEach((item, index) => {
                    const extras = item.order_item_extras?.map(e => e.extra_name).join(', ') || '-';
                    const itemPrice = ((item.size_price || item.menu_items.price) * item.quantity +
                        (item.order_item_extras?.reduce((sum, e) => sum + e.extra_price, 0) || 0) * item.quantity).toFixed(2);

                    rows.push([
                        ...orderBasics,
                        item.menu_items.name,
                        item.quantity.toString(),
                        item.size_name || '-',
                        extras,
                        itemPrice,
                        index === 0 ? order.subtotal.toFixed(2) : '',
                        index === 0 ? order.delivery_fee.toFixed(2) : '',
                        index === 0 ? order.total_amount.toFixed(2) : ''
                    ]);
                });
            } else {
                rows.push([
                    ...orderBasics,
                    '-', '-', '-', '-', '-',
                    order.subtotal.toFixed(2),
                    order.delivery_fee.toFixed(2),
                    order.total_amount.toFixed(2)
                ]);
            }
        });

        // Add total row at the end
        const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalRow = ['', '', '', '', '', '', '', '', '', '', 'Summe', totalAmount.toFixed(2) + ' €'];
        const MwstRow = ['', '', '', '', '', '', '', '', '', '', '', 'Preise inkl. 19% MwSt.'];
        rows.push(totalRow);
        rows.push(MwstRow);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        // Generate dynamic filename based on date filter
        let filename = 'Abrechnung';
        if (dateFilter === 'today') {
            filename += ' Heute';
        } else if (dateFilter === 'week') {
            filename += ' Diese Woche';
        } else if (dateFilter === 'month') {
            filename += ' Diesen Monat';
        } else if (dateFilter === 'last-month') {
            filename += ' Letzten Monat';
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const startFormatted = formatDateShort(customStartDate);
            const endFormatted = formatDateShort(customEndDate);
            filename += ` ${startFormatted} - ${endFormatted}`;
        } else {
            filename += ' Alle';
        }
        filename += '.csv';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('CSV-Export erfolgreich', 'success');
    };

    const toggleOrderExpansion = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div className="admin-abrechnungen-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Abrechnung</h1>
                        <p className="text-gray-600 mt-2">Übersicht für die Buchhaltung</p>
                    </div>
                    <button
                        onClick={loadOrders}
                        className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                        title="Aktualisieren"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="today">Heute</option>
                                <option value="week">Diese Woche</option>
                                <option value="month">Dieser Monat</option>
                                <option value="last-month">Letzter Monat</option>
                                <option value="all">Alle</option>
                                <option value="custom">Benutzerdefiniert</option>
                            </select>
                        </div>

                        {dateFilter === 'custom' && (
                            <>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Von</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bis</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bestellnummer suchen</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Bestellnummer eingeben..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <button
                            onClick={exportToCSV}
                            disabled={filteredOrders.length === 0}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            CSV Export
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Gesamtumsatz</p>
                                <p className="text-3xl font-bold mt-2">€{totals.total.toFixed(2)}</p>
                                <p className="text-blue-100 text-sm mt-1">{totals.count} Bestellungen</p>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Barzahlungen</p>
                                <p className="text-3xl font-bold mt-2">€{totals.cash.toFixed(2)}</p>
                                <p className="text-green-100 text-sm mt-1">{totals.cashCount} Bestellungen</p>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Online Bezahlt</p>
                                <p className="text-3xl font-bold mt-2">€{totals.online.toFixed(2)}</p>
                                <p className="text-purple-100 text-sm mt-1">{totals.onlineCount} Bestellungen</p>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="mt-4 text-gray-600">Lade Bestellungen...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-medium text-gray-900">Keine Bestellungen gefunden</h3>
                        <p className="text-gray-500 mt-2">Für den gewählten Zeitraum liegen keine Daten vor.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bestellnummer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Datum</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kunde</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Zahlungsart</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Zwischensumme</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Liefergebühr</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Gesamtbetrag</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.map((order) => {
                                        const isExpanded = expandedOrders.has(order.id);
                                        return (
                                            <React.Fragment key={order.id}>
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order.id)}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                        >
                                                            <svg
                                                                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-mono text-sm font-medium text-gray-900">#{String(order.id).substring(0, 8)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {order.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${order.payment_method === 'cash'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-purple-100 text-purple-800'
                                                            }`}>
                                                            {order.payment_method === 'cash' ? '💵 Barzahlung' : '💳 Online Bezahlt'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        €{order.subtotal.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        €{order.delivery_fee.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                        €{order.total_amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                                {isExpanded && order.order_items && (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Bestellte Artikel:</h4>
                                                                {order.order_items.map((item, index) => (
                                                                    <div key={index} className="flex justify-between items-start text-sm py-2 border-b border-gray-200 last:border-0">
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
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-sm font-bold text-gray-900">
                                            Summe ({filteredOrders.length} Bestellungen)
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            €{filteredOrders.reduce((sum, o) => sum + o.subtotal, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            €{filteredOrders.reduce((sum, o) => sum + o.delivery_fee, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            €{totals.total.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

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
