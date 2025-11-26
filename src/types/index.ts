// Menu Item Types
export interface Size {
    name: string;
    price: number;
    default?: boolean;
}

export interface Extra {
    id: string;
    name: string;
    price: number;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    available: boolean;
    sizes?: Size[];
    extras?: Extra[];
}

// Cart Types
export interface CartItem {
    cartItemId: string; // Unique ID for cart item (id + size + extras)
    id: string; // Original menu item ID
    name: string;
    price: number; // Base price
    size: Size;
    sizePrice: number;
    totalPrice: number; // Price including size + extras
    quantity: number;
    image?: string;
    extras: Extra[];
    extrasTotal: number;
}

// Order Types
export interface OrderItem {
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    size?: string;
    extras?: string[];
}

export interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    payment_method: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    items: OrderItem[];
    created_at: string;
    notes?: string;
}

// User Types
export interface User {
    id: string;
    email: string;
    role?: 'admin' | 'customer';
}

// Settings Types
export interface Settings {
    id: string;
    restaurant_name: string;
    restaurant_phone: string;
    restaurant_address: string;
    opening_hours: Record<number, { start: string; end: string }[]>;
    delivery_fee: number;
    min_order_amount: number;
}

// Stammkunden (Regular Customer) Types
export interface Stammkunde {
    id: string;
    name: string;
    phone: string;
    address: string;
    email?: string;
    notes?: string;
    created_at: string;
    total_orders?: number;
}
