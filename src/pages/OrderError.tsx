import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderError() {
    const navigate = useNavigate();
    const location = useLocation();
    const errorMessage = location.state?.errorMessage || 'Ein unerwarteter Fehler ist aufgetreten';
    const errorDetails = location.state?.errorDetails;
    const orderCreated = location.state?.orderCreated === true;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-primary-50 to-primary-50 flex items-center justify-center px-4 py-16">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                    {/* Icon - Different based on scenario */}
                    <div className="mb-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                            orderCreated ? 'bg-primary-100' : 'bg-red-100'
                        }`}>
                            <svg className={`w-12 h-12 ${orderCreated ? 'text-primary-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title - Different based on scenario */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {orderCreated ? 'Bestellung teilweise erfolgreich' : 'Bestellung fehlgeschlagen'}
                    </h1>
                    
                    <div className="mb-8">
                        <p className="text-lg text-gray-700 mb-4">
                            {errorMessage}
                        </p>
                        
                        {orderCreated ? (
                            // Order was created but email failed
                            <div className="bg-primary-50 border border-primary-300 rounded-lg p-6 mb-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="text-3xl">✅</div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm text-primary-900 font-semibold mb-1">
                                            Ihre Bestellung wurde erfasst!
                                        </p>
                                        <p className="text-sm text-primary-800">
                                            Ihre Bestellung ist bei uns eingegangen und wird bearbeitet.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border-2 border-primary-400">
                                    <div className="text-2xl">📞</div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-primary-900 mb-2">
                                            ⚠️ Wichtig: Bitte rufen Sie uns an!
                                        </p>
                                        <p className="text-sm text-primary-800 mb-2">
                                            Die automatische E-Mail-Bestätigung konnte nicht versendet werden.
                                        </p>
                                        <p className="text-sm font-semibold text-primary-900">
                                            Bitte kontaktieren Sie uns telefonisch, um Ihre Bestellung zu bestätigen und weitere Details zu erhalten.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Order creation failed completely
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-red-800 font-medium mb-2">
                                    ⚠️ Ihre Bestellung konnte nicht abgeschlossen werden
                                </p>
                                <p className="text-sm text-red-700 mb-3">
                                    Es gab ein Problem bei der Verarbeitung Ihrer Bestellung. Ihre Artikel befinden sich noch im Warenkorb.
                                </p>
                                <p className="text-sm text-red-800 font-semibold">
                                    Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.
                                </p>
                            </div>
                        )}

                        {errorDetails && (
                            <details className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                    Technische Details anzeigen
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                                    {errorDetails}
                                </pre>
                            </details>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-500 hover:from-primary-600 hover:to-primary-600 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Zur Startseite
                        </button>
                        <button
                            onClick={() => navigate('/menu')}
                            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-full font-semibold transition-all duration-300"
                        >
                            Zum Menü
                        </button>
                    </div>

                    {/* Contact Information - Prominent */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-500 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <h3 className="text-xl font-bold">Jetzt anrufen!</h3>
                        </div>
                        <p className="text-lg font-semibold mb-2">
                            📞 Kontaktieren Sie uns telefonisch
                        </p>
                        <p className="text-sm opacity-90">
                            Unser Team hilft Ihnen gerne weiter und bestätigt Ihre Bestellung
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
