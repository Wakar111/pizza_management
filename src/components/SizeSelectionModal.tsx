import { useState, useEffect } from 'react';
import type { MenuItem, Size } from '../types';
import { formatPrice } from '../utils/format';

interface SizeSelectionModalProps {
    show: boolean;
    menuItem: MenuItem | null;
    onClose: () => void;
    onSizeSelected: (size: Size) => void;
}

export default function SizeSelectionModal({ show, menuItem, onClose, onSizeSelected }: SizeSelectionModalProps) {
    const [selectedSize, setSelectedSize] = useState<Size | null>(null);

    useEffect(() => {
        if (show && menuItem && menuItem.sizes) {
            const defaultSize = menuItem.sizes.find(s => s.default) || null;
            setSelectedSize(defaultSize);
        }
    }, [show, menuItem]);

    if (!show || !menuItem) return null;

    // Use sizes from database (no fallback)
    const sizes = menuItem.sizes || [];

    const handleConfirm = () => {
        console.log('[SizeSelectionModal] handleConfirm with size:', selectedSize);
        if (selectedSize) {
            onSizeSelected(selectedSize);
        } else {
            console.error('[SizeSelectionModal] handleConfirm called but selectedSize is null');
        }
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
                        <p className="text-orange-100 text-sm mt-1">Größe wählen</p>
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
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-3">
                        {sizes.map((size, index) => {
                            const isSelected = selectedSize?.name === size.name;
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        console.log('[SizeSelectionModal] Clicked size:', size);
                                        setSelectedSize(size);
                                    }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all ${isSelected
                                        ? 'border-orange-400 bg-orange-50 shadow-md'
                                        : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                                }`}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900">{size.name}</span>
                                        </div>
                                        <span className="text-orange-600 font-semibold text-lg">
                                            {formatPrice(size.price)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Fixed Bottom Bar */}
                <div className="border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
                    {selectedSize && (
                        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Ausgewählt:</span>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">{selectedSize.name}</p>
                                    <p className="text-orange-600 font-bold text-lg">{formatPrice(selectedSize.price)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedSize}
                            className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors shadow-lg ${selectedSize
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Weiter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
