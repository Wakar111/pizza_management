
import { Link } from 'react-router-dom';
import { useOpeningHours } from '../../hooks/useOpeningHours';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { settingsService } from '../../lib/supabase';
import { RESTAURANT_INFO } from '../../config/restaurant';

interface DeliveryArea {
    id: string;
    plz: string;
    city: string;
}

export default function UserInfo() {
    const { isOpen, statusMessage, openingHours, loading } = useOpeningHours();
    const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);

    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [location]);

    useEffect(() => {
        loadDeliveryAreas();
    }, []);

    const loadDeliveryAreas = async () => {
        try {
            setLoadingAreas(true);
            const areas = await settingsService.getDeliveryAreas();
            setDeliveryAreas(areas);
        } catch (error) {
            console.error('Error loading delivery areas:', error);
        } finally {
            setLoadingAreas(false);
        }
    };

    return (
        <div className="info-page">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Informationen</h1>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Alles, was Sie über Restaurant Hunger wissen müssen
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">Warum Restaurant Hunger?</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🌱</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Frische Zutaten</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Täglich frisch von lokalen Bauern und Märkten bezogen.
                                Nur die besten Zutaten kommen in unsere Küche.
                            </p>
                        </div>

                        <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🚚</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Schnelle Lieferung</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Warme, frische Gerichte in ca. 30-45 Minuten direkt zu Ihnen nach Hause.
                                Pünktlich und zuverlässig.
                            </p>
                        </div>

                        <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">⭐</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Ausgezeichnete Qualität</h3>
                            <p className="text-gray-600 leading-relaxed">
                                4.9/5 Sterne von über 5000 zufriedenen Kunden.
                                Qualität, die Sie schmecken können.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delivery Areas Section */}
            <section id="delivery-areas" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="inline-block bg-primary-100 rounded-full p-3 mb-4">
                            <span className="text-4xl">📍</span>
                        </div>
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">Unsere Liefergebiete</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Wir liefern gerne in die folgenden Gebiete direkt zu Ihnen nach Hause
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {loadingAreas ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                                <p className="mt-4 text-gray-600">Lade Liefergebiete...</p>
                            </div>
                        ) : deliveryAreas.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600">Derzeit sind keine Liefergebiete verfügbar.</p>
                                <p className="text-sm text-gray-500 mt-2">Bitte kontaktieren Sie uns für weitere Informationen.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                                    <span className="text-3xl">🚚</span>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Verfügbare Lieferzonen</h3>
                                        <p className="text-gray-600">Wir liefern in {deliveryAreas.length} {deliveryAreas.length === 1 ? 'Gebiet' : 'Gebiete'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {deliveryAreas.map((area) => (
                                        <div
                                            key={area.id}
                                            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">🚚</span>
                                                <span className="font-bold text-primary-700 text-lg">{area.plz}</span>
                                            </div>
                                            <div className="text-gray-800 font-medium">{area.city}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Wichtiger Hinweis</h4>
                                            <p className="text-sm text-blue-800">
                                                Beim Bestellen können Sie nur aus den oben aufgeführten Liefergebieten wählen.
                                                Falls Ihr Gebiet nicht aufgeführt ist, kontaktieren Sie uns bitte direkt.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Contact & Hours Section */}
            <section id="opening-hours" className="py-20 bg-white">

                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Kontakt</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                                        <p className="text-gray-600">{RESTAURANT_INFO.address.street}</p>
                                        <p className="text-gray-600">{RESTAURANT_INFO.address.zip} {RESTAURANT_INFO.address.city}</p>
                                        <p className="text-gray-600">{RESTAURANT_INFO.address.country}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                                        <a href={`tel:${RESTAURANT_INFO.contact.phone.replace(/\s/g, '')}`} className="text-primary-600 hover:text-primary-700">
                                            {RESTAURANT_INFO.contact.phone}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">E-Mail</h3>
                                        <a href="mailto:info@restaurant-hunger.de" className="text-primary-600 hover:text-primary-700">
                                            info@restaurant-hunger.de
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Opening Hours */}
                        <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Öffnungszeiten</h2>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Lädt Öffnungszeiten...</div>
                                ) : (
                                    [
                                        { day: 'Montag', hours: openingHours[1] || [] },
                                        { day: 'Dienstag', hours: openingHours[2] || [] },
                                        { day: 'Mittwoch', hours: openingHours[3] || [] },
                                        { day: 'Donnerstag', hours: openingHours[4] || [] },
                                        { day: 'Freitag', hours: openingHours[5] || [] },
                                        { day: 'Samstag', hours: openingHours[6] || [] },
                                        { day: 'Sonntag', hours: openingHours[0] || [] },
                                    ].map((schedule, index) => (
                                        <div key={index} className="py-3 border-b border-gray-200">
                                            <div className="font-semibold text-gray-900 mb-2">{schedule.day}</div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {schedule.hours.length > 0 ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Lieferung:</span>
                                                            <span className="font-medium">
                                                                {schedule.hours.map(h => `${h.start} - ${h.end}`).join(', ')}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Abholung:</span>
                                                            <span className="font-medium">
                                                                {schedule.hours.map(h => `${h.start} - ${h.end}`).join(', ')}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Lieferung:</span>
                                                            <span className="font-medium">Geschlossen</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Abholung:</span>
                                                            <span className="font-medium">Geschlossen</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className={`mt-6 p-4 rounded-lg border ${isOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center">
                                        {isOpen ? (
                                            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                            </svg>
                                        )}
                                        <span className={`font-semibold ${isOpen ? 'text-green-800' : 'text-red-800'}`}>{statusMessage}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Über uns</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Authentische Küche mit Leidenschaft serviert
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="prose prose-lg">
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Seit über 15 Jahren verwöhnen wir unsere Gäste mit authentischen Gerichten,
                                    die mit Leidenschaft und den besten regionalen Zutaten zubereitet werden.
                                </p>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Unser Küchenchef Marco Rossi bringt traditionelle Rezepte aus seiner
                                    italienischen Heimat mit modernen Kochtechniken zusammen. Jedes Gericht
                                    wird mit größter Sorgfalt und Liebe zum Detail zubereitet.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    Wir legen großen Wert auf Qualität und Frische. Unsere Zutaten beziehen
                                    wir täglich von lokalen Bauern und Märkten, um Ihnen das beste
                                    Geschmackserlebnis zu garantieren.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mt-8">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-primary-600 mb-2">15+</div>
                                    <div className="text-sm text-gray-600">Jahre Erfahrung</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-primary-600 mb-2">5000+</div>
                                    <div className="text-sm text-gray-600">Zufriedene Kunden</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-primary-600 mb-2">4.9</div>
                                    <div className="text-sm text-gray-600">★ Bewertung</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-xl">
                                <div className="text-9xl">👨‍🍳</div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-2xl">
                                <div className="text-2xl font-bold text-primary-600">Küchenchef</div>
                                <div className="text-gray-600">Marco Rossi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Haben Sie Fragen?
                    </h2>
                    <p className="text-xl mb-10 opacity-90">
                        Kontaktieren Sie uns - wir helfen Ihnen gerne weiter!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="tel:+493012345678"
                            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl inline-flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            Anrufen
                        </a>
                        <Link to="/menu"
                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105">
                            Jetzt bestellen
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
