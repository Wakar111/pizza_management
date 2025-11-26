import { useState, useEffect } from 'react';
import type { MenuItem, Extra, Size } from '../types';
import { extrasService } from '../lib/supabase';
import { formatPrice } from '../utils/format';

interface ExtrasModalProps {
    show: boolean;
    menuItem: MenuItem | null;
    selectedSize?: Size | null;
    basePrice?: number;
    onClose: () => void;
    onAddToCart: (data: { menuItem: MenuItem; selectedExtras: Extra[]; totalPrice: number }) => void;
}

// Category icons mapping
const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        'Fleisch': '🥩',
        'Käse': '🧀',
        'Gemüse': '🥬',
        'Saucen': '🍯',
        'Sonstiges': '➕'
    };
    return icons[category] || '➕';
};

export default function ExtrasModal({ show, menuItem, selectedSize, basePrice: propBasePrice, onClose, onAddToCart }: ExtrasModalProps) {
    console.log('[ExtrasModal] Render props:', { show, menuItemId: menuItem?.id, selectedSize, basePrice: propBasePrice });
    const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
    const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
    const [loading, setLoading] = useState(false);

    // Load extras from database when menu item changes
    useEffect(() => {
        const loadExtras = async () => {
            if (!menuItem?.id) return;

            try {
                setLoading(true);
                console.log('[ExtrasModal] Loading extras for item:', menuItem.id);

                const extras = await extrasService.getExtrasForMenuItem(menuItem.id);
                setAvailableExtras(extras || []);

                console.log('[ExtrasModal] Loaded extras:', extras?.length || 0);
            } catch (error) {
                console.error('[ExtrasModal] Error loading extras:', error);
                setAvailableExtras([]);
            } finally {
                setLoading(false);
            }
        };

        if (show) {
            loadExtras();
            setSelectedExtras([]); // Reset selections when modal opens
        }
    }, [show, menuItem?.id]);

    if (!show || !menuItem) return null;

    // Group extras by category
    const extrasGrouped: Record<string, Extra[]> = {};
    availableExtras.forEach(extra => {
        const category = (extra as any).category || 'Sonstiges';
        if (!extrasGrouped[category]) {
            extrasGrouped[category] = [];
        }
        extrasGrouped[category].push(extra);
    });

    const toggleExtra = (extra: Extra) => {
        setSelectedExtras(current => {
            const exists = current.find(e => e.id === extra.id);
            if (exists) {
                return current.filter(e => e.id !== extra.id);
            } else {
                return [...current, extra];
            }
        });
    };

    const isExtraSelected = (extraId: string | number) => {
        return selectedExtras.some(e => e.id === extraId);
    };

    const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);

    // Use prop basePrice if available, otherwise calculate
    const effectiveBasePrice = propBasePrice !== undefined ? propBasePrice : (selectedSize ? selectedSize.price : menuItem.price);
    // Ensure it's a number
    const numericBasePrice = typeof effectiveBasePrice === 'string'
        ? parseFloat((effectiveBasePrice as string).replace(',', '.'))
        : effectiveBasePrice;

    const totalPrice = numericBasePrice + extrasTotal;

    const handleAddToCart = () => {
        onAddToCart({
            menuItem,
            selectedExtras,
            totalPrice
        });
        setSelectedExtras([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Orange Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{menuItem.name}</h3>
                        <p className="text-orange-100 text-sm mt-1">Extras hinzufügen</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-orange-100 transition-colors ml-4 p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                        </div>
                    ) : Object.keys(extrasGrouped).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-lg font-medium">Keine Extras verfügbar</p>
                            <p className="text-sm mt-1">Für dieses Gericht sind keine Extras hinterlegt.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(extrasGrouped).map(([category, extras]) => (
                                <div key={category}>
                                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                                        <span className="text-2xl mr-2">{getCategoryIcon(category)}</span>
                                        {category}
                                    </h4>
                                    <div className="space-y-2">
                                        {extras.map((extra) => {
                                            const isSelected = isExtraSelected(extra.id);
                                            return (
                                                <label
                                                    key={extra.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                                        ? 'border-orange-300 bg-orange-50'
                                                        : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleExtra(extra)}
                                                            className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                                                        />
                                                        <span className="font-medium text-gray-800">{extra.name}</span>
                                                    </div>
                                                    <span className="text-orange-600 font-semibold">+{formatPrice(extra.price)}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Bar */}
                <div className="border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
                    {/* Price Summary */}
                    <div className="flex justify-between text-sm mb-4">
                        <div className="space-y-1">
                            <p className="text-gray-600">Basispreis</p>
                            <p className="text-gray-600">Extras</p>
                            <p className="font-bold text-gray-900">Gesamt</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="font-medium text-gray-900">{formatPrice(numericBasePrice)}</p>
                            <p className="font-medium text-orange-600">+{formatPrice(extrasTotal)}</p>
                            <p className="font-bold text-orange-600 text-xl">{formatPrice(totalPrice)}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg font-medium transition-colors shadow-lg"
                        >
                            In den Warenkorb
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
