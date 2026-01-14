import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { menuService } from '../lib/supabase';
import { useOpeningHours } from '../hooks/useOpeningHours';
import { formatPrice, getCategoryClass } from '../utils/format';
import SizeSelectionModal from '../components/SizeSelectionModal';
import ExtrasModal from '../components/ExtrasModal';
import Toast from '../components/Toast';
import PromotionBanner from '../components/PromotionBanner';
import WetPaintButton from '../components/WetPaintButton';
import FloatingCartButton from '../components/FloatingCartButton';
import type { MenuItem, Size } from '../types';

export default function Home() {
    const { addItem } = useCart();
    const { isOpen, statusMessage, loading: openingHoursLoading } = useOpeningHours();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
    const [showSizeModal, setShowSizeModal] = useState(false);

    // Unified state for ExtrasModal to avoid sync issues
    const [extrasModalState, setExtrasModalState] = useState<{
        show: boolean;
        menuItem: MenuItem | null;
        selectedSize: Size | null;
    }>({
        show: false,
        menuItem: null,
        selectedSize: null
    });

    const [showToast, setShowToast] = useState(false);

    console.log('[Home] Render:', {
        selectedMenuItemId: selectedMenuItem?.id,
        selectedMenuItemPrice: selectedMenuItem?.price,
        extrasModalState
    });

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const items = await menuService.getMenuItems();
            setMenuItems(items);
        } catch (err) {
            console.error('Error loading menu items:', err);
        } finally {
            setLoading(false);
        }
    };

    const displayedMenuItems = menuItems.filter(item => item.category === 'Pizza').slice(0, 10);

    const handleAddToCart = (item: MenuItem) => {
        console.log('[Home] handleAddToCart called for:', item.name);
        if (item.sizes && item.sizes.length > 0) {
            setSelectedMenuItem(item);
            setShowSizeModal(true);
        } else {
            const defaultSize = { name: 'Standard', price: item.price };
            addItem(item, [], item.price, defaultSize);
            setShowToast(true);
        }
    };

    const handleSizeSelected = (size: Size) => {
        console.log('[Home] handleSizeSelected called with:', size);
        setShowSizeModal(false);

        // Update unified state
        setExtrasModalState({
            show: true,
            menuItem: selectedMenuItem,
            selectedSize: size
        });
    };

    const handleAddToCartWithExtras = (data: any) => {
        const size = extrasModalState.selectedSize || { name: 'Standard', price: data.menuItem.price };
        addItem(data.menuItem, data.selectedExtras, data.totalPrice, size);
        setExtrasModalState(prev => ({ ...prev, show: false }));
        setShowToast(true);
    };

    return (
        <div className="home">
            {/* Promotion Banner */}
            <PromotionBanner />
            {/* Hero Section */}
            <section className="relative min-h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden py-12 md:py-0">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 md:bg-gradient-to-br md:from-black/70 md:via-black/50 md:to-black/70"></div>
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url(/crusty-bg-image.jpg)' }}
                ></div>
                {/* Dark red overlay to dim the image and blend with theme */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/80 to-black/85"></div>
                

                <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left side: Text content */}
                        <div className="text-white">
                            {/* Opening Status Badge - Only show when closed */}
                            {!openingHoursLoading && !isOpen && (
                                <Link
                                    to="/user/info#opening-hours"
                                    className="mb-6 inline-flex items-center px-4 py-2 md:px-6 md:py-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer bg-red-500/90 hover:bg-red-600/90"
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-semibold text-white text-sm md:text-base">{statusMessage}</span>
                                </Link>
                            )}

                            <div className="mb-6 md:mb-8">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight">
                                    Restaurant
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-100">
                                        Crusty Pizza
                                    </span>
                                </h1>
                                <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl leading-relaxed">
                                    Erleben Sie authentische Küche mit den frischesten Zutaten,
                                    meisterhaft zubereitet und mit Leidenschaft serviert
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-start mb-8 md:mb-0">
                                <WetPaintButton to="/menu">
                                    <span className="text-white">Jetzt bestellen</span>
                                </WetPaintButton>
                            </div>
                        </div>

                        {/* Right side: Pizza image - visible on desktop only */}
                        <div className="hidden md:flex justify-center items-center">
                            <img
                                src="/crusty-logo.png"
                                alt="Delicious Pizza"
                                className="w-full max-w-md h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Menu Preview Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Unsere Speisekarte</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            Entdecken Sie unsere vielfältige Auswahl an köstlichen Gerichten
                        </p>
                        <div className="w-20 h-1 bg-gradient-to-r from-primary-600 to-primary-500 mx-auto rounded-full"></div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            <p className="mt-2 text-gray-600">Menü wird geladen...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {displayedMenuItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3">
                                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                            {item.name}
                                                        </h3>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryClass(item.category)}`}>
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                                                </div>
                                                <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                                    <span className="text-base font-medium text-gray-900">{formatPrice(item.price)}</span>
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="inline-flex items-center justify-center p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-200"
                                                        title="Zum Warenkorb hinzufügen"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-8">
                                <Link
                                    to="/menu"
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl inline-block"
                                >
                                    Vollständiges Menü ansehen
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">Warum Crusty Pizza?</h2>
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
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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

            {/* Modals */}
            <SizeSelectionModal
                show={showSizeModal}
                menuItem={selectedMenuItem}
                onClose={() => setShowSizeModal(false)}
                onSizeSelected={handleSizeSelected}
            />

            <ExtrasModal
                show={extrasModalState.show}
                menuItem={extrasModalState.menuItem}
                selectedSize={extrasModalState.selectedSize}
                basePrice={extrasModalState.selectedSize ? (typeof (extrasModalState.selectedSize.price as unknown) === 'string' ? parseFloat((extrasModalState.selectedSize.price as unknown as string).replace(',', '.')) : extrasModalState.selectedSize.price) : (extrasModalState.menuItem?.price || 0)}
                onClose={() => setExtrasModalState(prev => ({ ...prev, show: false }))}
                onAddToCart={handleAddToCartWithExtras}
            />

            <Toast
                show={showToast}
                message="Artikel zum Warenkorb hinzugefügt!"
                onClose={() => setShowToast(false)}
            />

            {/* Floating Cart Button */}
            <FloatingCartButton />
        </div>
    );
}
