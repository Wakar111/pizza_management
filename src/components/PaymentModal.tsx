import { useState } from 'react';
import { formatPrice } from '../utils/format';
import type { CartItem } from '../types';
import type { Discount } from '../lib/supabase';

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    onBack: () => void;
    onSubmit: (paymentMethod: string) => void;
    items: CartItem[];
    totalPrice: number;
    deliveryFee: number;
    discounts?: Discount[];
    totalDiscountAmount?: number;
    customerData: {
        name: string;
        phone: string;
        zip: string;
        city: string;
        street: string;
        email: string;
        notes: string;
    };
    submitting: boolean;
}

export default function PaymentModal({
    show,
    onBack,
    onSubmit,
    items,
    totalPrice,
    deliveryFee,
    discounts = [],
    totalDiscountAmount = 0,
    customerData,
    submitting
}: PaymentModalProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    if (!show) return null;

    const subtotalAfterDiscount = totalPrice - totalDiscountAmount;
    const totalAmount = subtotalAfterDiscount + deliveryFee;
    const totalDiscountPercentage = discounts.reduce((sum, discount) => sum + discount.percentage, 0);

    const handleSubmit = () => {
        if (selectedPaymentMethod && acceptedTerms) {
            onSubmit(selectedPaymentMethod);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Bestellübersicht</h2>

                {/* Order Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3 text-gray-900">Ihre Bestellung</h3>
                    <div className="space-y-2 text-sm">
                        {items.map(item => (
                            <div key={item.cartItemId} className="flex justify-between text-gray-700">
                                <span>{item.quantity}x {item.name} ({item.size.name})</span>
                                <span className="font-medium">{formatPrice(item.totalPrice * item.quantity)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Zwischensumme:</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                            {discounts.length > 0 && (
                                <>
                                    {discounts.map((discount) => {
                                        const discountAmount = (totalPrice * discount.percentage) / 100;
                                        return (
                                            <div key={discount.id} className="flex justify-between text-green-600 font-medium">
                                                <span>🎁 {discount.name} (-{discount.percentage}%):</span>
                                                <span>-{formatPrice(discountAmount)}</span>
                                            </div>
                                        );
                                    })}
                                    {discounts.length > 1 && (
                                        <div className="flex justify-between text-green-700 font-bold border-t border-green-100 pt-2 mt-1">
                                            <span>💰 Gesamt Rabatt ({totalDiscountPercentage}%):</span>
                                            <span>-{formatPrice(totalDiscountAmount)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Liefergebühr:</span>
                                <span>{formatPrice(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
                                <span>Gesamt:</span>
                                <span className="text-orange-600">{formatPrice(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2 text-gray-900">Lieferadresse</h3>
                    <div className="text-sm text-gray-700">
                        <p>{customerData.name}</p>
                        <p>{customerData.street}</p>
                        <p>{customerData.zip} {customerData.city}</p>
                        <p className="mt-2">Tel: {customerData.phone}</p>
                        <p>E-Mail: {customerData.email}</p>
                        {customerData.notes && (
                            <p className="mt-2 italic">Anmerkung: {customerData.notes}</p>
                        )}
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-gray-900">Zahlungsmethode wählen</h3>
                    <div className="space-y-3">
                        {/* Cash Payment */}
                        <div
                            onClick={() => setSelectedPaymentMethod('cash')}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'cash'
                                ? 'border-orange-600 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-6 h-6 mr-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'cash' ? 'border-orange-600' : 'border-gray-300'
                                        }`}>
                                        {selectedPaymentMethod === 'cash' && (
                                            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-2">💵</span>
                                        <span className="font-semibold text-gray-900">Barzahlung bei Lieferung</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Bezahlen Sie bequem in bar beim Lieferfahrer</p>
                                </div>
                            </div>
                        </div>

                        {/* PayPal Payment - Controlled by env variable */}
                        <div
                            onClick={() => import.meta.env.VITE_ENABLE_PAYPAL === 'true' && setSelectedPaymentMethod('paypal')}
                            className={`p-4 border-2 rounded-lg transition-all ${import.meta.env.VITE_ENABLE_PAYPAL !== 'true'
                                    ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-100'
                                    : `cursor-pointer ${selectedPaymentMethod === 'paypal'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`
                                }`}
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-6 h-6 mr-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'paypal' ? 'border-blue-600' : 'border-gray-300'
                                        }`}>
                                        {selectedPaymentMethod === 'paypal' && (
                                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-2">🅿️</span>
                                        <span className="font-semibold text-gray-900">PayPal</span>
                                        {import.meta.env.VITE_ENABLE_PAYPAL !== 'true' && (
                                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Deaktiviert</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {import.meta.env.VITE_ENABLE_PAYPAL !== 'true'
                                            ? 'PayPal ist derzeit nicht verfügbar'
                                            : 'Sicher bezahlen mit PayPal'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms and Conditions */}
                <div className={`mb-6 p-4 border-2 rounded-lg ${!acceptedTerms && selectedPaymentMethod ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}>
                    <label className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={e => setAcceptedTerms(e.target.checked)}
                            className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                            Ich habe die <a href="#" className="text-orange-600 hover:underline font-medium">Allgemeinen Geschäftsbedingungen</a> gelesen und akzeptiere diese.
                            Mit der Bestellung verpflichte ich mich zum Kauf der bestellten Waren.
                        </span>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                        Zurück
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedPaymentMethod || !acceptedTerms || submitting}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${selectedPaymentMethod && acceptedTerms && !submitting
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {submitting ? 'Wird gesendet...' : 'Kostenpflichtig bestellen'}
                    </button>
                </div>
            </div>
        </div>
    );
}
