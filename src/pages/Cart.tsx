import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { orderService, settingsService, type Discount } from '../lib/supabase';
import { formatPrice } from '../utils/format';
import Toast from '../components/Toast';
import CheckoutModal from '../components/CheckoutModal';
import PaymentModal from '../components/PaymentModal';

export default function Cart() {
    const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Settings state
    const [minimumOrderValue, setMinimumOrderValue] = useState(20.00);
    const [deliveryFee, setDeliveryFee] = useState(2.50);
    const [activeDiscount, setActiveDiscount] = useState<Discount | null>(null);

    // Modal state
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [customerData, setCustomerData] = useState<any>(null);

    useEffect(() => {
        loadSettings();
        loadActiveDiscount();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await settingsService.getSettings();
            setMinimumOrderValue(parseFloat(settings.minimum_order_value) || 20.00);
            setDeliveryFee(parseFloat(settings.delivery_fee) || 2.50);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadActiveDiscount = async () => {
        try {
            const discount = await settingsService.getActiveDiscount();
            setActiveDiscount(discount);
        } catch (error) {
            console.error('Error loading active discount:', error);
        }
    };

    // Calculate discount
    const discountAmount = activeDiscount ? (totalPrice * activeDiscount.percentage) / 100 : 0;
    const subtotalAfterDiscount = totalPrice - discountAmount;
    const actualDeliveryFee = subtotalAfterDiscount >= minimumOrderValue ? 0 : deliveryFee;
    const totalAmount = subtotalAfterDiscount + actualDeliveryFee;
    const remainingForFreeDelivery = Math.max(0, minimumOrderValue - subtotalAfterDiscount);

    const handleCheckoutClick = () => {
        setShowCheckoutModal(true);
    };

    const handleCheckoutNext = (data: any) => {
        setCustomerData(data);
        setShowCheckoutModal(false);
        setShowPaymentModal(true);
    };

    const handleSubmitOrder = async (paymentMethod: string) => {
        if (!customerData) return;

        setSubmitting(true);

        try {
            const fullAddress = `${customerData.street}, ${customerData.zip} ${customerData.city}`;

            await orderService.createOrder({
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                customer_address: fullAddress,
                customer_email: customerData.email,
                notes: customerData.notes,
                subtotal: totalPrice,
                delivery_fee: actualDeliveryFee,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                items: items
            });

            clearCart();
            setShowPaymentModal(false);
            setToastMessage('Bestellung erfolgreich aufgegeben!');
            setShowToast(true);

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            console.error('Error submitting order:', error);
            setToastMessage('Fehler beim Aufgeben der Bestellung');
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="mb-8">
                    <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ihr Warenkorb ist leer</h2>
                <p className="text-gray-600 mb-8">Fügen Sie Artikel aus unserem Menü hinzu</p>
                <button
                    onClick={() => navigate('/menu')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                    Zum Menü
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Warenkorb</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.cartItemId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                <p className="text-gray-600">Größe: {item.size.name} ({formatPrice(item.sizePrice)})</p>
                                {item.extras.length > 0 && (
                                    <div className="mt-1">
                                        <p className="text-sm text-gray-500">Extras:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.extras.map(extra => (
                                                <span key={extra.id} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                                                    {extra.name} (+{formatPrice(extra.price)})
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Extras gesamt: +{formatPrice(item.extrasTotal)}</p>
                                    </div>
                                )}
                                <p className="text-sm font-medium text-gray-900 mt-2">
                                    Preis pro Stück: {formatPrice(item.totalPrice)}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 self-end sm:self-center">
                                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                        className="w-8 h-8 rounded-md bg-white shadow-sm text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                        className="w-8 h-8 rounded-md bg-white shadow-sm text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <div className="text-lg font-bold text-gray-900">{formatPrice(item.totalPrice * item.quantity)}</div>
                                    <button
                                        onClick={() => removeItem(item.cartItemId)}
                                        className="text-xs text-red-500 hover:text-red-700 hover:underline mt-1 transition-colors"
                                    >
                                        Entfernen
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 text-gray-900">Bestellübersicht</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Zwischensumme:</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                            {activeDiscount && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>🎁 {activeDiscount.name} (-{activeDiscount.percentage}%):</span>
                                    <span>-{formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Liefergebühr:</span>
                                {actualDeliveryFee === 0 ? (
                                    <span className="text-green-600 font-medium">Kostenlos</span>
                                ) : (
                                    <span>{formatPrice(actualDeliveryFee)}</span>
                                )}
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Gesamt:</span>
                                <span className="text-2xl font-bold text-gray-900">{formatPrice(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 text-sm">
                            {remainingForFreeDelivery > 0 ? (
                                <>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-lg">💰</span>
                                        <span className="text-amber-900 font-medium">Liefergebühr: {formatPrice(deliveryFee)}</span>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-amber-200">
                                        <span className="text-lg">🎁</span>
                                        <span className="text-amber-800">
                                            Noch <span className="font-bold">{formatPrice(remainingForFreeDelivery)}</span> bis zur kostenlosen Lieferung (ab {formatPrice(minimumOrderValue)})
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <span className="text-lg">🎉</span>
                                    <span>Kostenlose Lieferung aktiviert!</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCheckoutClick}
                            className="w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                        >
                            Zur Kasse
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CheckoutModal
                show={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onNext={handleCheckoutNext}
            />

            <PaymentModal
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onBack={() => {
                    setShowPaymentModal(false);
                    setShowCheckoutModal(true);
                }}
                onSubmit={handleSubmitOrder}
                items={items}
                totalPrice={totalPrice}
                deliveryFee={actualDeliveryFee}
                discount={activeDiscount}
                discountAmount={discountAmount}
                customerData={customerData || {}}
                submitting={submitting}
            />

            <Toast
                show={showToast}
                message={toastMessage}
                type={toastMessage.includes('erfolgreich') ? 'success' : 'error'}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}
