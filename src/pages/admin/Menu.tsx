import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { menuService } from '../../lib/supabase';
import Toast from '../../components/Toast';
import type { MenuItem } from '../../types';

interface Size {
    name: string;
    price: number | string;
    default?: boolean;
}

interface ItemForm {
    id?: string;
    name: string;
    description: string;
    category: string;
    price: number | string;
    available: boolean;
    sizes: Size[];
}

export default function Menu() {
    console.log('========== MENU COMPONENT RENDERED ==========');
    
    // Initialize menuItems from localStorage if available
    const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
        try {
            const cached = localStorage.getItem('admin_menu_items');
            if (cached) {
                console.log('[AdminMenu] Loaded from localStorage');
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('[AdminMenu] Error loading from localStorage:', err);
        }
        return [];
    });
    
    // Set initial loading to false if we have cached data
    const [loading, setLoading] = useState(() => {
        try {
            const cached = localStorage.getItem('admin_menu_items');
            // If we have cached data, don't show loading spinner
            return !cached;
        } catch {
            return true;
        }
    });
    const [saving, setSaving] = useState(false);
    const loadingRef = useRef(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('Alle');

    const [itemForm, setItemForm] = useState<ItemForm>({
        name: '',
        description: '',
        category: '',
        price: 0,
        available: true,
        sizes: []
    });


    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // Categories
    const categories = ['Alle', 'Pizza', 'Pasta', 'Burger', 'Salate', 'Vorspeisen', 'Desserts', 'Getränke'];

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    }, []);

    const getCategoryCount = (category: string) => {
        if (category === 'Alle') return menuItems.length;
        return menuItems.filter(item => item.category === category).length;
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'Alle') {
            return menuItems;
        }
        return menuItems.filter(item => item.category === selectedCategory);
    }, [menuItems, selectedCategory]);

    const availableItems = useMemo(() => filteredItems.filter(item => item.available !== false), [filteredItems]);
    const unavailableItems = useMemo(() => filteredItems.filter(item => item.available === false), [filteredItems]);

    const loadMenuItems = useCallback(async () => {
        if (loadingRef.current) {
            console.log('[AdminMenu] Already loading, skipping...');
            return;
        }
        
        loadingRef.current = true;
        console.log('[AdminMenu] Loading menu items...');
        
        try {
            setLoading(true);
            console.log('[AdminMenu] Calling menuService.getAllMenuItems()...');
            
            // Get all items including unavailable ones for admin
            const { data, error } = await menuService.getAllMenuItems();
            console.log('[AdminMenu] menuService returned, data:', data?.length, 'error:', error);

            if (error) {
                console.error('[AdminMenu] Error from menuService:', error);
                throw error;
            }

            console.log('[AdminMenu] Loaded', data?.length || 0, 'items');
            // Only update if we got data
            if (data) {
                setMenuItems(data);
                // Save to localStorage
                try {
                    localStorage.setItem('admin_menu_items', JSON.stringify(data));
                    console.log('[AdminMenu] Saved to localStorage');
                } catch (err) {
                    console.error('[AdminMenu] Error saving to localStorage:', err);
                }
            }
        } catch (error: any) {
            console.error('[AdminMenu] Error loading menu items:', error);
            setToastMessage('Fehler beim Laden des Menüs: ' + error.message);
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
            loadingRef.current = false;
            console.log('[AdminMenu] Loading complete');
        }
    }, []);

    useEffect(() => {
        // Load data immediately on mount
        loadMenuItems();
        
        // Don't reload on tab visibility change - it causes Supabase queries to hang
        // The localStorage cache will keep data visible between tab switches
    }, []);

    const editItem = (item: MenuItem) => {
        setEditingItem(item);
        // Destructure to exclude 'image' since ItemForm doesn't have it
        const { image, ...itemWithoutImage } = item;
        setItemForm({
            ...itemWithoutImage,
            sizes: item.sizes ? JSON.parse(JSON.stringify(item.sizes)) : []
        });
        setShowEditModal(true);
        setShowAddModal(false);
    };

    const normalizePrice = () => {
        if (typeof itemForm.price === 'string') {
            const normalized = parseFloat(itemForm.price.replace(',', '.'));
            if (!isNaN(normalized)) {
                setItemForm(prev => ({ ...prev, price: normalized }));
            }
        }
    };

    const normalizeSizePrice = (index: number, value: string) => {
        const newSizes = [...itemForm.sizes];
        // Just update the value as string first to allow typing
        newSizes[index].price = value;
        setItemForm(prev => ({ ...prev, sizes: newSizes }));
    };

    const onSizePriceBlur = (index: number) => {
        const newSizes = [...itemForm.sizes];
        const price = newSizes[index].price;
        if (typeof price === 'string') {
            const normalized = parseFloat(price.replace(',', '.'));
            if (!isNaN(normalized)) {
                newSizes[index].price = normalized;
                setItemForm(prev => ({ ...prev, sizes: newSizes }));
            }
        }
    };

    const addSize = () => {
        setItemForm(prev => ({
            ...prev,
            sizes: [...prev.sizes, {
                name: '',
                price: '',
                default: prev.sizes.length === 0
            }]
        }));
    };

    const removeSize = (index: number) => {
        const newSizes = [...itemForm.sizes];
        newSizes.splice(index, 1);
        if (newSizes.length > 0) {
            const hasDefault = newSizes.some(s => s.default);
            if (!hasDefault) {
                newSizes[0].default = true;
            }
        }
        setItemForm(prev => ({ ...prev, sizes: newSizes }));
    };

    const setDefaultSize = (index: number) => {
        const newSizes = itemForm.sizes.map((size, i) => ({
            ...size,
            default: i === index
        }));
        setItemForm(prev => ({ ...prev, sizes: newSizes }));
    };

    const closeModal = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingItem(null);
        setItemForm({
            name: '',
            description: '',
            category: '',
            price: 0,
            available: true,
            sizes: []
        });
    };

    const saveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Normalize main price
            let finalPrice = itemForm.price;
            if (typeof finalPrice === 'string') {
                finalPrice = parseFloat(finalPrice.replace(',', '.'));
            }

            // Validate sizes
            let finalSizes = [...itemForm.sizes];
            if (finalSizes.length > 0) {
                const emptySizes = finalSizes.filter(s => !s.name || s.name.trim() === '');
                if (emptySizes.length > 0) {
                    showNotification('Bitte geben Sie einen Namen für alle Größen ein', 'error');
                    setSaving(false);
                    return;
                }

                finalSizes = finalSizes.map(s => {
                    let normalizedPrice = s.price;
                    if (typeof s.price === 'string') {
                        normalizedPrice = parseFloat(s.price.replace(',', '.'));
                    }
                    return {
                        ...s,
                        name: s.name.trim(),
                        price: normalizedPrice as number
                    };
                });

                const invalidPrices = finalSizes.filter(s => !s.price || (s.price as number) <= 0);
                if (invalidPrices.length > 0) {
                    showNotification('Bitte geben Sie einen gültigen Preis für alle Größen ein', 'error');
                    setSaving(false);
                    return;
                }

                const hasDefault = finalSizes.some(s => s.default);
                if (!hasDefault) {
                    finalSizes[0].default = true;
                }
            }

            // Update default price based on sizes
            if (finalSizes.length > 0) {
                const defaultSize = finalSizes.find(s => s.default);
                if (defaultSize) {
                    finalPrice = defaultSize.price as number;
                } else {
                    finalPrice = finalSizes[0].price as number;
                }
            }


            // Construct itemData explicitly to ensure proper database structure
            const itemData: Partial<MenuItem> = {
                name: itemForm.name,
                description: itemForm.description,
                category: itemForm.category,
                price: finalPrice as number,
                available: itemForm.available,
                sizes: finalSizes.length > 0 ? (finalSizes as import('../../types').Size[]) : undefined, // Cast to global Size type after price normalization
            };

            console.log('[AdminMenu] Saving item with data:', itemData);
            console.log('[AdminMenu] finalSizes:', finalSizes);

            if (showEditModal && editingItem) {
                await menuService.updateMenuItem(editingItem.id, itemData);
                showNotification('Gericht erfolgreich aktualisiert!', 'success');
            } else {
                await menuService.addMenuItem(itemData);
                showNotification('Gericht erfolgreich hinzugefügt!', 'success');
            }

            await loadMenuItems();
            closeModal();
        } catch (error: any) {
            console.error('[AdminMenu] Error saving item:', error);
            showNotification('Fehler beim Speichern: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!window.confirm('Sind Sie sicher, dass Sie dieses Gericht löschen möchten?')) {
            return;
        }

        try {
            await menuService.deleteMenuItem(itemId);
            setMenuItems(prev => prev.filter(item => item.id !== itemId));
            showNotification('Gericht erfolgreich gelöscht!', 'success');
        } catch (error: any) {
            console.error('[AdminMenu] Error deleting item:', error);
            showNotification('Fehler beim Löschen: ' + error.message, 'error');
        }
    };



    return (
        <div className="admin-menu-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center gap-4 mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Menü verwalten</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Neues Gericht
                    </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-medium transition-colors ${selectedCategory === category
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                            <span className="ml-1 text-xs opacity-75">
                                ({getCategoryCount(category)})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <p className="mt-2 text-gray-600">Menü wird geladen...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Available Dishes Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-green-50 border-b border-green-100 px-6 py-4">
                                <h2 className="text-xl font-semibold text-green-900 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Verfügbare Gerichte
                                    <span className="ml-2 text-sm font-normal text-green-700">({availableItems.length})</span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left py-3 px-4">Name</th>
                                            <th className="text-left py-3 px-4">Kategorie</th>
                                            <th className="text-left py-3 px-4">Preis</th>
                                            <th className="text-left py-3 px-4">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                                    Keine verfügbaren Gerichte
                                                </td>
                                            </tr>
                                        ) : (
                                            availableItems.map(item => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <p className="text-sm text-gray-600">{item.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {item.sizes && item.sizes.length > 0 ? (
                                                            <div>
                                                                <div className="font-medium text-gray-900 mb-1">Größen:</div>
                                                                <div className="space-y-1">
                                                                    {item.sizes.map((size: any) => (
                                                                        <div key={size.name} className="text-sm">
                                                                            <span className="font-medium">{size.name}</span>: €{size.price.toFixed(2)}
                                                                            {size.default && <span className="ml-1 text-xs text-green-600">⭐</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="font-medium">
                                                                €{item.price.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => editItem(item)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Bearbeiten
                                                            </button>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                                title="Löschen"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Unavailable Dishes Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-red-50 border-b border-red-100 px-6 py-4">
                                <h2 className="text-xl font-semibold text-red-900 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Nicht verfügbare Gerichte
                                    <span className="ml-2 text-sm font-normal text-red-700">({unavailableItems.length})</span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left py-3 px-4">Bild</th>
                                            <th className="text-left py-3 px-4">Name</th>
                                            <th className="text-left py-3 px-4">Kategorie</th>
                                            <th className="text-left py-3 px-4">Preis</th>
                                            <th className="text-left py-3 px-4">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unavailableItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                                    Keine deaktivierten Gerichte
                                                </td>
                                            </tr>
                                        ) : (
                                            unavailableItems.map(item => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50 opacity-75">
                                                    <td className="py-3 px-4">
                                                        <img
                                                            src={item.image || '/placeholder-food.jpg'}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded grayscale"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium text-gray-700">{item.name}</p>
                                                            <p className="text-sm text-gray-500">{item.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {item.sizes && item.sizes.length > 0 ? (
                                                            <div>
                                                                <div className="font-medium text-gray-700 mb-1">Größen:</div>
                                                                <div className="space-y-1">
                                                                    {item.sizes.map((size: any) => (
                                                                        <div key={size.name} className="text-sm text-gray-600">
                                                                            <span className="font-medium">{size.name}</span>: €{size.price.toFixed(2)}
                                                                            {size.default && <span className="ml-1 text-xs text-green-600">⭐</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="font-medium text-gray-600">
                                                                €{item.price.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => editItem(item)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Bearbeiten
                                                            </button>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                                title="Löschen"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {(showAddModal || showEditModal) && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={closeModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        <div
                            className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-lg">
                                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                                    {showEditModal ? 'Gericht bearbeiten' : 'Neues Gericht hinzufügen'}
                                </h2>
                            </div>

                            {/* Modal Content */}
                            <form onSubmit={saveItem}>
                                <div className="px-6 py-5 space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="item-name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                        <input
                                            id="item-name"
                                            value={itemForm.name}
                                            onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="z.B. Pizza Margherita"
                                        />
                                    </div>

                                    {/* Beschreibung */}
                                    <div>
                                        <label htmlFor="item-description" className="block text-sm font-semibold text-gray-700 mb-2">Beschreibung</label>
                                        <textarea
                                            id="item-description"
                                            value={itemForm.description}
                                            onChange={e => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                            rows={3}
                                            placeholder="Beschreibe das Gericht..."
                                        />
                                    </div>

                                    {/* Kategorie */}
                                    <div>
                                        <label htmlFor="item-category" className="block text-sm font-semibold text-gray-700 mb-2">Kategorie</label>
                                        <select
                                            id="item-category"
                                            value={itemForm.category}
                                            onChange={e => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                        >
                                            <option value="">Kategorie wählen...</option>
                                            {categories.filter(c => c !== 'Alle').map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Preis */}
                                    <div>
                                        <label htmlFor="item-price" className="block text-sm font-semibold text-gray-700 mb-2">Preis (€)</label>
                                        <input
                                            id="item-price"
                                            value={itemForm.price}
                                            onChange={e => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="9.9"
                                            onBlur={normalizePrice}
                                        />
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            Standardpreis (wird überschrieben, wenn Größen definiert sind)
                                            <br />
                                            💡 Komma (15,99) oder Punkt (15.99) verwenden
                                        </p>
                                    </div>

                                    {/* Größenvarianten */}
                                    <div className="border-t pt-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-semibold text-gray-700">Größenvarianten (optional)</label>
                                            <button
                                                type="button"
                                                onClick={addSize}
                                                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Größe hinzufügen
                                            </button>
                                        </div>

                                        {itemForm.sizes.length === 0 ? (
                                            <div className="text-sm text-gray-500 italic py-2">
                                                Keine Größen definiert. Das Gericht hat nur eine Standardgröße.
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {itemForm.sizes.map((size, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                    >
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                value={size.name}
                                                                onChange={e => {
                                                                    const newSizes = [...itemForm.sizes];
                                                                    newSizes[index].name = e.target.value;
                                                                    setItemForm(prev => ({ ...prev, sizes: newSizes }));
                                                                }}
                                                                type="text"
                                                                placeholder="z.B. Normal, Menü"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                                required
                                                                maxLength={50}
                                                            />
                                                            <input
                                                                value={size.price}
                                                                onChange={e => normalizeSizePrice(index, e.target.value)}
                                                                onBlur={() => onSizePriceBlur(index)}
                                                                type="text"
                                                                placeholder="9.9"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center gap-2 pt-1">
                                                            <label className="flex items-center text-xs text-gray-600 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={size.default || false}
                                                                    onChange={() => setDefaultSize(index)}
                                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-1.5"
                                                                />
                                                                Standard
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSize(index)}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                title="Größe entfernen"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-2.5 space-y-0.5">
                                            <p className="text-xs text-gray-500">
                                                💡 Tipp: Markiere eine Größe als "Standard" für die Vorauswahl
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ✓ Umlaute (ä, ö, ü) und Sonderzeichen sind erlaubt
                                            </p>
                                        </div>
                                    </div>



                                    {/* Verfügbar */}
                                    <div className="flex items-center pt-2">
                                        <input
                                            checked={itemForm.available}
                                            onChange={e => setItemForm(prev => ({ ...prev, available: e.target.checked }))}
                                            type="checkbox"
                                            id="available"
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-2"
                                        />
                                        <label htmlFor="available" className="text-sm font-medium text-gray-700">Verfügbar</label>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="sticky bottom-0 bg-gray-50 border-t px-4 py-3 sm:px-6 sm:py-4 flex gap-2 sm:gap-3 rounded-b-lg">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {saving ? 'Wird gespeichert...' : 'Speichern'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                <Toast
                    show={showToast}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                    duration={3000}
                />
            </div>
        </div>
    );
}
