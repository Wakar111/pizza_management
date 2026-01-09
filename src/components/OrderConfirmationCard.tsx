import { useState, useEffect } from 'react';
import { orderService, settingsService } from '../lib/supabase';
import Toast from './Toast';

interface Order {
    id: string;
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

interface OrderConfirmationCardProps {
    order: Order;
    onConfirmed: () => void;
    onDeclined: () => void;
}

export default function OrderConfirmationCard({ order, onConfirmed, onDeclined }: OrderConfirmationCardProps) {
    const [estimatedTime, setEstimatedTime] = useState<number>(30); // in minutes
    const [loading, setLoading] = useState(false);
    const [loadingDefaults, setLoadingDefaults] = useState(true);
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
        show: false, 
        message: '', 
        type: 'success' 
    });

    // Load default times from settings
    useEffect(() => {
        const loadDefaultTimes = async () => {
            try {
                const settings = await settingsService.getSettings();
                if (order.order_type === 'pickup') {
                    const pickupTime = settings.estimated_pickup_time || '15';
                    setEstimatedTime(parseInt(pickupTime, 10));
                } else {
                    const deliveryTime = settings.estimated_delivery_time || '40-60';
                    // Extract first number from range
                    const match = deliveryTime.match(/\d+/);
                    setEstimatedTime(match ? parseInt(match[0], 10) : 40);
                }
            } catch (error) {
                console.error('Error loading default times:', error);
                setEstimatedTime(order.order_type === 'pickup' ? 15 : 40);
            } finally {
                setLoadingDefaults(false);
            }
        };
        loadDefaultTimes();
    }, [order.order_type]);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await orderService.confirmOrder(order.id, `${estimatedTime} Minuten`);
            setToast({ show: true, message: '✅ Bestellung bestätigt und E-Mail gesendet!', type: 'success' });
            setTimeout(() => onConfirmed(), 1500);
        } catch (error) {
            console.error('Error confirming order:', error);
            setToast({ show: true, message: '❌ Fehler beim Bestätigen der Bestellung', type: 'error' });
            setLoading(false);
        }
    };

    const handleDeclineClick = () => {
        setShowDeclineConfirm(true);
    };

    const handleDeclineConfirm = async () => {
        setShowDeclineConfirm(false);
        setLoading(true);
        try {
            await orderService.declineOrder(order.id);
            setToast({ show: true, message: '✅ Bestellung abgelehnt und E-Mail gesendet!', type: 'success' });
            setTimeout(() => onDeclined(), 1500);
        } catch (error) {
            console.error('Error declining order:', error);
            setToast({ show: true, message: '❌ Fehler beim Ablehnen der Bestellung', type: 'error' });
            setLoading(false);
        }
    };

    const handleDeclineCancel = () => {
        setShowDeclineConfirm(false);
    };

    const adjustTime = (delta: number) => {
        setEstimatedTime(prev => Math.max(5, prev + delta));
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} Min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    return (
        <>
            <Toast 
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
                duration={3000}
            />
            <div className="bg-white border-2 border-orange-200 rounded-xl p-4 shadow-md">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{order.customer_name}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            order.order_type === 'pickup' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            {order.order_type === 'pickup' ? '🏃 Abholung' : '🚚 Lieferung'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600">€{order.total_amount.toFixed(2)}</p>
                    {order.customer_phone && (
                        <p className="text-sm text-gray-600">📞 {order.customer_phone}</p>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                    </div>
                </div>

                {/* Address/Notes */}
                {order.order_type === 'delivery' && order.customer_address && (
                <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">📍 </span>{order.customer_address}
                    </div>
                )}
                {order.notes && (
                <div className="mb-3 p-2 bg-yellow-50 rounded text-sm">
                    <span className="font-medium">💬 </span>{order.notes}
                    </div>
                )}

                {/* Time Adjustment */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {order.order_type === 'pickup' ? 'Abholzeit' : 'Lieferzeit'}
                </label>
                {loadingDefaults ? (
                    <div className="text-center text-gray-500 text-sm">Lade...</div>
                ) : (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => adjustTime(-5)}
                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-lg"
                            disabled={loading}
                        >
                            −
                        </button>
                        <div className="text-center min-w-[100px]">
                            <div className="text-2xl font-bold text-orange-600">
                                {formatTime(estimatedTime)}
                            </div>
                            <div className="text-xs text-gray-500">geschätzt</div>
                        </div>
                        <button
                            onClick={() => adjustTime(5)}
                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-lg"
                            disabled={loading}
                        >
                            +
                        </button>
                    </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                <button
                    onClick={handleDeclineClick}
                    disabled={loading || loadingDefaults}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ❌ Ablehnen
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={loading || loadingDefaults}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Wird bestätigt...' : '✅ Bestätigen'}
                    </button>
                </div>

                {/* Decline Confirmation Modal */}
                {showDeclineConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Bestellung ablehnen?</h3>
                            <p className="text-gray-600 mb-6">Möchten Sie diese Bestellung wirklich ablehnen? Der Kunde wird per E-Mail benachrichtigt.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeclineCancel}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleDeclineConfirm}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                                >
                                    Ablehnen
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
