import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { settingsService } from '../lib/supabase';

export default function OrderSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const orderNumber = location.state?.orderNumber;
    const customerEmail = location.state?.customerEmail;
    const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('40-50');

    useEffect(() => {
        // Redirect to home if accessed directly without order data
        if (!orderNumber) {
            navigate('/');
        }

        // Load estimated delivery time
        loadEstimatedDeliveryTime();
    }, [orderNumber, navigate]);

    const loadEstimatedDeliveryTime = async () => {
        try {
            const settings = await settingsService.getSettings();
            if (settings.estimated_delivery_time) {
                setEstimatedDeliveryTime(settings.estimated_delivery_time);
            }
        } catch (error) {
            console.error('Error loading delivery time:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-16">
            <div className="max-w-2xl w-full">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Bestellung erfolgreich! 🎉
                    </h1>
                    <p className="text-xl text-gray-600">
                        Vielen Dank für Ihre Bestellung
                    </p>
                </div>

                {/* Order Details Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    {orderNumber && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <p className="text-sm text-gray-500 mb-2">Bestellnummer</p>
                            <p className="text-3xl font-bold text-orange-600">#{orderNumber}</p>
                        </div>
                    )}

                    {/* Email Confirmation Notice */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    📧 Bestätigungs-E-Mail unterwegs
                                </h3>
                                <p className="text-blue-800 mb-2">
                                    Wir haben eine Bestätigung an <span className="font-semibold">{customerEmail || 'Ihre E-Mail-Adresse'}</span> gesendet.
                                </p>
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 font-medium flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>
                                            Bitte überprüfen Sie auch Ihren <strong>Spam-Ordner</strong>, falls Sie die E-Mail nicht innerhalb von 5 Minuten erhalten.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* What's Next */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Was passiert als Nächstes?</h3>

                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold">1</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Ihre Bestellung wird bearbeitet</p>
                                <p className="text-sm text-gray-600">Unser Team bereitet Ihre Bestellung vor</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Zubereitung</p>
                                <p className="text-sm text-gray-600">Ihre Bestellung wird frisch zubereitet</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold">3</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Lieferung</p>
                                <p className="text-sm text-gray-600">Ihr Essen ist in ca. {estimatedDeliveryTime} Minuten bei Ihnen</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                    >
                        Weiter einkaufen
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all border-2 border-gray-200"
                    >
                        Zur Startseite
                    </button>
                </div>
            </div>
        </div>
    );
}
