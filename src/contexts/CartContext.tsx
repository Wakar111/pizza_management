import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, MenuItem, Size, Extra } from '../types';

const CART_STORAGE_KEY = 'pizza-cart';

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (menuItem: MenuItem, selectedExtras?: Extra[], customTotalPrice?: number | null, size?: Size | null) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const totalPrice = items.reduce((sum, item) => {
        const itemTotal = item.totalPrice || item.price;
        return sum + (itemTotal * item.quantity);
    }, 0);

    const addItem = (
        menuItem: MenuItem,
        selectedExtras: Extra[] = [],
        customTotalPrice: number | null = null,
        size: Size | null = null
    ) => {
        // Generate unique cart ID based on item + size + extras combination
        const extrasIds = selectedExtras.map(e => e.id).sort().join(',');
        const sizeName = size?.name || 'Standard';
        const cartItemId = `${menuItem.id}_${sizeName}_${extrasIds}`;

        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.cartItemId === cartItemId);

            if (existingItem) {
                // Same item with same size and extras - increase quantity
                return currentItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // New item or different size/extras combination
                const sizePrice = size?.price || menuItem.price;
                const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
                const totalPrice = customTotalPrice || (sizePrice + extrasTotal);

                const newItem: CartItem = {
                    cartItemId,
                    id: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    size: size || { name: 'Standard', price: menuItem.price },
                    sizePrice,
                    totalPrice,
                    quantity: 1,
                    image: menuItem.image,
                    extras: selectedExtras,
                    extrasTotal
                };

                return [...currentItems, newItem];
            }
        });
    };

    const removeItem = (cartItemId: string) => {
        setItems(currentItems => currentItems.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(cartItemId);
        } else {
            setItems(currentItems =>
                currentItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity }
                        : item
                )
            );
        }
    };

    const clearCart = () => {
        setItems([]);
    };

    // Save cart to localStorage whenever items change
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [items]);

    return (
        <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
