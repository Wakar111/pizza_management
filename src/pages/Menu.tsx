import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { menuService } from '../lib/supabase';
import { formatPrice, getCategoryClass } from '../utils/format';
import SizeSelectionModal from '../components/SizeSelectionModal';
import ExtrasModal from '../components/ExtrasModal';
import Toast from '../components/Toast';
import FloatingCartButton from '../components/FloatingCartButton';
import type { MenuItem, Size } from '../types';

export default function Menu() {
    const { addItem } = useCart();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('Alle');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('name-asc');
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);

    // Size modal state
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

    // Unified state for ExtrasModal
    const [extrasModalState, setExtrasModalState] = useState<{
        show: boolean;
        menuItem: MenuItem | null;
        selectedSize: Size | null;
    }>({
        show: false,
        menuItem: null,
        selectedSize: null
    });

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        console.log('Loading menu items...');
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

    const categories = ['Alle', ...Array.from(new Set(menuItems.map(item => item.category)))];

    const filteredAndSortedItems = menuItems
        .filter(item => selectedCategory === 'Alle' || item.category === selectedCategory)
        .filter(item => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
        })
        .sort((a, b) => {
            if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'de');
            if (sortOption === 'name-desc') return b.name.localeCompare(a.name, 'de');
            if (sortOption === 'price-asc') return a.price - b.price;
            if (sortOption === 'price-desc') return b.price - a.price;
            return 0;
        });

    const handleAddToCart = (item: MenuItem) => {
        if (item.sizes && item.sizes.length > 0) {
            setSelectedMenuItem(item);
            setShowSizeModal(true);
        } else {
            addItem(item, [], item.price, { name: 'Standard', price: item.price });
            setShowToast(true);
        }
    };

    const handleSizeSelected = (size: Size) => {
        setShowSizeModal(false);
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
        <div className="menu-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900">Unsere Speisekarte</h1>
                    <div className="w-20 h-1 bg-gradient-to-r from-primary-600 to-primary-500 mx-auto rounded-full"></div>
                </div>

                {/* Category Filter */}
                <div className="flex justify-center mb-12">
                    <div className="flex flex-wrap justify-center gap-2 bg-white rounded-xl p-1 shadow-lg border border-gray-100">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-2 rounded-lg transition-all duration-300 font-medium ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-4">
                    <div className="w-full md:w-1/2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Suche Gerichte..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow shadow-sm"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow shadow-sm"
                        >
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                            <option value="price-asc">Preis aufsteigend</option>
                            <option value="price-desc">Preis absteigend</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <p className="mt-2 text-gray-600">Menü wird geladen...</p>
                    </div>
                ) : (
                    <>
                        {/* Menu Items List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {filteredAndSortedItems.map((item) => (
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

                        {/* Empty State */}
                        {filteredAndSortedItems.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-600">Keine Gerichte in dieser Kategorie gefunden.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

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
