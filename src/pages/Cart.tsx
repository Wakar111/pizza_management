import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { orderService, settingsService, type Discount } from '../lib/supabase';
import { formatPrice } from '../utils/format';
import { useOpeningHours } from '../hooks/useOpeningHours';
import CheckoutModal from '../components/CheckoutModal';
import PaymentModal from '../components/PaymentModal';

export default function Cart() {
    const { items, totalPrice, updateQuantity, removeItem, removeExtra, clearCart } = useCart();
    const navigate = useNavigate();
    const { isOpen, statusMessage, loading: openingHoursLoading } = useOpeningHours();
    const [submitting, setSubmitting] = useState(false);

    // Settings state
    const [minimumOrderValue, setMinimumOrderValue] = useState(20.00);
    const [deliveryFee, setDeliveryFee] = useState(2.50);
    const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);

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
            const discounts = await settingsService.getAllActiveDiscounts();
            setActiveDiscounts(discounts);
        } catch (error) {
            console.error('Error loading active discounts:', error);
        }
    };

    // Filter discounts that have a percentage (only those apply to cart)
    const applicableDiscounts = activeDiscounts.filter(discount => discount.percentage !== null && discount.percentage > 0);

    // Calculate total discount by summing all applicable discount percentages
    const totalDiscountPercentage = applicableDiscounts.reduce((sum, discount) => sum + (discount.percentage || 0), 0);
    const totalDiscountAmount = (totalPrice * totalDiscountPercentage) / 100;
    const subtotalAfterDiscount = totalPrice - totalDiscountAmount;
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

            const order = await orderService.createOrder({
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                customer_address: fullAddress,
                customer_email: customerData.email,
                notes: customerData.notes,
                subtotal: totalPrice,
                delivery_fee: actualDeliveryFee,
                discounts: applicableDiscounts.map(discount => ({
                    name: discount.name,
                    percentage: discount.percentage || 0,
                    amount: (totalPrice * (discount.percentage || 0)) / 100
                })),
                discount_amount: totalDiscountAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                items: items
            });

            clearCart();
            setShowPaymentModal(false);

            // Navigate to success page with order details
            navigate('/order-success', {
                state: {
                    orderNumber: order?.id,
                    customerEmail: customerData.email
                }
            });
        } catch (error) {
            console.error('Error submitting order:', error);
            console.log('Error details:', {
                message: (error as any)?.message,
                orderCreated: (error as any)?.orderCreated,
                orderId: (error as any)?.orderId
            });

            // Close modals
            setShowPaymentModal(false);
            setShowCheckoutModal(false);

            // Check if order was created but email failed
            const orderCreated = (error as any)?.orderCreated === true;
            console.log('Order created flag:', orderCreated);

            if (orderCreated) {
                // Order was saved successfully, but email failed
                // Clear cart since order is in database
                clearCart();

                // Navigate to error page with specific message
                navigate('/order-error', {
                    state: {
                        orderCreated: true,
                        errorMessage: 'Ihre Bestellung wurde erfolgreich erfasst, aber die E-Mail-Bestätigung konnte nicht versendet werden.',
                        errorDetails: `Bestellung wurde in der Datenbank gespeichert.\nE-Mail-Versand fehlgeschlagen.\n\nZeitpunkt: ${new Date().toLocaleString('de-DE')}`
                    }
                });
            } else {
                // Order creation failed completely
                // Determine error message
                let errorMessage = 'Es gab ein Problem mit dem Server. Bitte versuchen Sie es später erneut.';
                let errorDetails = '';

                if (error instanceof Error) {
                    errorDetails = error.message;

                    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                        errorMessage = 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
                    }
                }

                // Navigate to error page
                navigate('/order-error', {
                    state: {
                        orderCreated: false,
                        errorMessage,
                        errorDetails: `${errorDetails}\n\nZeitpunkt: ${new Date().toLocaleString('de-DE')}`
                    }
                });
            }
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
                                                <button
                                                    key={extra.id}
                                                    onClick={() => removeExtra(item.cartItemId, extra.id)}
                                                    className="group text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-colors flex items-center gap-1"
                                                    title={`${extra.name} entfernen`}
                                                >
                                                    <span>{extra.name} (+{formatPrice(extra.price)})</span>
                                                    <svg className="w-3 h-3 text-orange-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
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
                            {applicableDiscounts.length > 0 && (
                                <>
                                    {applicableDiscounts.map((discount) => {
                                        const discountAmount = (totalPrice * (discount.percentage || 0)) / 100;
                                        return (
                                            <div key={discount.id} className="flex justify-between text-green-600 font-medium">
                                                <span>🎁 {discount.name}{discount.percentage ? ` (-${discount.percentage}%)` : ''}:</span>
                                                <span>-{formatPrice(discountAmount)}</span>
                                            </div>
                                        );
                                    })}
                                    {applicableDiscounts.length > 1 && (
                                        <div className="flex justify-between text-green-700 font-bold border-t border-green-100 pt-2">
                                            <span>💰 Gesamt Rabatt ({totalDiscountPercentage}%):</span>
                                            <span>-{formatPrice(totalDiscountAmount)}</span>
                                        </div>
                                    )}
                                </>
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

                        {/* Delivery Area Hint */}
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">📍</span>
                                <div>
                                    <p className="text-sm font-medium text-blue-900 mb-1">Liefergebiete</p>
                                    <p className="text-xs text-blue-700">
                                        Sie können nur aus den vom Restaurant definierten Liefergebieten wählen.
                                        <Link to="/user/info#delivery-areas" className="underline hover:text-blue-900 ml-1">
                                            Verfügbare Gebiete ansehen
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Opening Status Indicator - Only show when closed */}
                        {!openingHoursLoading && !isOpen && (
                            <div className="mb-4 p-4 rounded-lg border bg-red-50 border-red-200">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-semibold text-red-800">{statusMessage}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCheckoutClick}
                            disabled={!isOpen || openingHoursLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${!isOpen || openingHoursLoading
                                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transform hover:scale-[1.02]'
                                } text-white`}
                        >
                            {openingHoursLoading ? 'Lädt...' : !isOpen ? 'Restaurant geschlossen' : 'Zur Kasse'}
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
                discounts={applicableDiscounts}
                totalDiscountAmount={totalDiscountAmount}
                customerData={customerData || {}}
                submitting={submitting}
            />

        </div>
    );
}
