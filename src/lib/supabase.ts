import { createClient } from '@supabase/supabase-js';
import { sendOrderEmails } from './emailService';
import type { MenuItem } from '../types';

// Discount type
export interface Discount {
    id: string;
    name: string;
    percentage: number | null;
    startDate: string | null;
    endDate: string | null;
    enabled: boolean;
}

// Opening Hours type
export interface OpeningHour {
    id: string;
    day_of_week: number;
    period_index: number;
    start_time: string;
    end_time: string;
    is_closed: boolean;
}

export interface OpeningPeriod {
    start: string;
    end: string;
}

// Supabase initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid credentials
const hasValidCreds = supabaseUrl && supabaseKey && supabaseUrl.includes('.supabase.co');

// Simple mock data for local development without backend
const mockData = {
    menu_items: [
        { id: '1', name: 'Pizza Margherita Classica', description: 'Handgemachter Pizzateig mit Tomaten, Mozzarella und Basilikum, im Holzofen gebacken.', price: 12.90, category: 'Pizza', image: 'https://images.unsplash.com/photo-1565299507177-b6b2b93e13ac?auto=format&fit=crop&w=800', available: true },
        { id: '2', name: 'Spaghetti Carbonara Tradizionale', description: 'Spaghetti mit cremiger Soße aus Ei, Guanciale und Pecorino.', price: 15.90, category: 'Pasta', image: 'https://images.unsplash.com/photo-1495450948688-8e0d6a90cb9e?auto=format&fit=crop&w=800', available: true },
        { id: '3', name: 'Caesar Salad Classico', description: 'Römersalat mit Croutons, Parmesan und Hähnchenbrust.', price: 13.50, category: 'Salate', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2e8d7?auto=format&fit=crop&w=800', available: true },
    ],
    orders: [] as any[],
    admin_users: [] as any[],
    user_profiles: [] as any[],
};

let orderAutoId = 1;

// Create mock Supabase client for development
function createMockSupabase() {
    let currentUser: any = null;

    return {
        auth: {
            async signInWithPassword({ email, password: _password }: any) {
                const user = { id: 'mock-user-' + Math.random().toString(36).slice(2), email };
                const session = { user };
                currentUser = user;
                return { data: { user, session }, error: null };
            },
            async signUp({ email, password: _password, options }: any) {
                const user = { id: 'mock-user-' + Math.random().toString(36).slice(2), email };
                currentUser = user;

                const isAdmin = email.includes('admin');
                mockData.user_profiles.push({
                    id: user.id,
                    email: email,
                    name: options?.data?.name || '',
                    role: isAdmin ? 'admin' : 'customer'
                });

                if (isAdmin) {
                    mockData.admin_users.push({ user_id: user.id });
                }

                return { data: { user }, error: null };
            },
            async signOut() {
                currentUser = null;
                return { error: null };
            },
            async getSession() {
                return { data: { session: currentUser ? { user: currentUser } : null }, error: null };
            },
            onAuthStateChange(cb: any) {
                setTimeout(() => {
                    cb('SIGNED_IN', currentUser ? { user: currentUser } : null);
                }, 100);
                return { data: { subscription: { unsubscribe() { } } } };
            },
        },
        from(table: string) {
            return {
                select() {
                    return {
                        eq() { return this; },
                        order() { return this; },
                        single() {
                            if (table === 'user_profiles' && currentUser) {
                                const profile = mockData.user_profiles?.find((p: any) => p.id === currentUser.id);
                                if (profile) {
                                    return Promise.resolve({ data: profile, error: null });
                                }
                            }
                            if (table === 'admin_users' && currentUser) {
                                const adminUser = mockData.admin_users?.find((a: any) => a.user_id === currentUser.id);
                                if (adminUser) {
                                    return Promise.resolve({ data: adminUser, error: null });
                                }
                            }
                            return Promise.resolve({ data: null, error: { message: 'not found (mock)' } });
                        },
                        then(resolve: any) {
                            const data = JSON.parse(JSON.stringify((mockData as any)[table] || []));
                            resolve({ data, error: null });
                        },
                    };
                },
                insert(rows: any) {
                    return {
                        select() {
                            if (table === 'orders') {
                                const inserted = rows.map((r: any) => ({ id: orderAutoId++, created_at: new Date().toISOString(), status: 'pending', ...r }));
                                mockData.orders.unshift(...inserted);
                                return Promise.resolve({ data: inserted, error: null });
                            }
                            if (table === 'menu_items') {
                                const nextId = Math.max(0, ...mockData.menu_items.map((m: any) => parseInt(m.id))) + 1;
                                const inserted = rows.map((r: any) => ({ id: nextId.toString(), ...r }));
                                mockData.menu_items.push(...inserted);
                                return Promise.resolve({ data: inserted, error: null });
                            }
                            return Promise.resolve({ data: rows, error: null });
                        }
                    };
                },
                update(updates: any) {
                    return {
                        eq(_: any, id: any) {
                            return {
                                select() {
                                    if (table === 'menu_items') {
                                        const idx = mockData.menu_items.findIndex((m: any) => m.id === id);
                                        if (idx >= 0) {
                                            mockData.menu_items[idx] = { ...mockData.menu_items[idx], ...updates };
                                            return Promise.resolve({ data: [mockData.menu_items[idx]], error: null });
                                        }
                                    }
                                    if (table === 'orders') {
                                        const idx = mockData.orders.findIndex((o: any) => o.id === id);
                                        if (idx >= 0) {
                                            mockData.orders[idx] = { ...mockData.orders[idx], ...updates };
                                            return Promise.resolve({ data: [mockData.orders[idx]], error: null });
                                        }
                                    }
                                    return Promise.resolve({ data: [], error: { message: 'not found (mock)' } });
                                }
                            };
                        }
                    };
                },
                delete() {
                    return {
                        eq(_: any, id: any) {
                            if (table === 'menu_items') {
                                const lenBefore = mockData.menu_items.length;
                                mockData.menu_items = mockData.menu_items.filter((m: any) => m.id !== id);
                                const ok = mockData.menu_items.length !== lenBefore;
                                return Promise.resolve({ error: ok ? null : { message: 'not found (mock)' } });
                            }
                            return Promise.resolve({ error: null });
                        }
                    };
                }
            };
        }
    };
}

let supabase: any;

if (hasValidCreds) {
    console.log('[Pizza] Connected to Supabase:', supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'pizza-auth-token'
        }
    });
} else {
    console.warn('[Pizza] Supabase configuration invalid. Using mock client for development.');
    supabase = createMockSupabase();
}

export { supabase };

// Menu Service
export const menuService = {
    async getMenuItems(): Promise<MenuItem[]> {
        console.log('[menuService] Fetching menu items...');

        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            console.error('[menuService] Error:', error);
            if (!hasValidCreds) return mockData.menu_items as MenuItem[];
            throw error;
        }

        const availableItems = data?.filter((item: any) => item.available !== false) || [];
        return availableItems as MenuItem[];
    },

    async getAllMenuItems() {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            if (!hasValidCreds) return { data: mockData.menu_items, error: null };
            return { data: null, error };
        }

        return { data: data || [], error: null };
    },

    async addMenuItem(item: Partial<MenuItem>) {
        const { data, error } = await supabase
            .from('menu_items')
            .insert([item])
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateMenuItem(id: string, updates: Partial<MenuItem>) {
        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteMenuItem(id: string) {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Order Service
export const orderService = {
    async createOrder(orderData: any) {
        console.log('[orderService] Creating order:', orderData);

        try {
            // TEST: Simulate database error (uncomment to test)
            // throw new Error('Simulated database error');

            // Create the order with awaiting_confirmation status (admin needs to confirm first)
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: orderData.customer_name,
                    customer_phone: orderData.customer_phone,
                    customer_email: orderData.customer_email,
                    customer_address: orderData.customer_address,
                    notes: orderData.notes,
                    subtotal: orderData.subtotal,
                    delivery_fee: orderData.delivery_fee,
                    total_amount: orderData.total_amount,
                    payment_method: orderData.payment_method || 'cash',
                    payment_status: orderData.payment_status || 'pending',
                    status: 'awaiting_confirmation', // Wait for admin confirmation
                    order_type: orderData.order_type || 'delivery',
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = orderData.items.map((item: any) => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price: item.totalPrice || item.price,
                size_name: item.size?.name || null,
                size_price: item.size?.price || null
            }));

            const { data: createdItems, error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)
                .select();

            if (itemsError) throw itemsError;

            // Create order item extras
            const extrasToInsert: any[] = [];
            orderData.items.forEach((cartItem: any, index: number) => {
                if (cartItem.extras && cartItem.extras.length > 0) {
                    const orderItemId = createdItems[index].id;
                    cartItem.extras.forEach((extra: any) => {
                        extrasToInsert.push({
                            order_item_id: orderItemId,
                            extra_id: extra.id,
                            extra_name: extra.name,
                            extra_price: extra.price
                        });
                    });
                }
            });

            if (extrasToInsert.length > 0) {
                const { error: extrasError } = await supabase
                    .from('order_item_extras')
                    .insert(extrasToInsert);

                if (extrasError) throw extrasError;
            }

            // NOTE: Emails are NOT sent here anymore
            // Admin must confirm the order first, then emails will be sent via confirmOrder()
            console.log('[orderService] Order created successfully, awaiting admin confirmation');

            return order;
        } catch (error) {
            console.error('[orderService] Error:', error);
            // Check if this is an email error (order was created successfully)
            if ((error as any).orderCreated === true) {
                // Re-throw with the flag intact
                throw error;
            }
            // For other errors, just throw
            throw error;
        }
    },

    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (
          *,
          menu_items (name, price),
          order_item_extras (*)
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateOrderStatus(orderId: string, status: string) {
        // Convert orderId to number if it's a string that looks like a number
        // This is needed because int8 columns in Supabase need numeric comparison
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', numericId)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteOrder(orderId: string) {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

            // First, get all order items for this order
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', numericId);

            if (itemsError) throw itemsError;

            // Delete order_item_extras for each order item
            if (orderItems && orderItems.length > 0) {
                const orderItemIds = orderItems.map((item: any) => item.id);
                
                const { error: extrasError } = await supabase
                    .from('order_item_extras')
                    .delete()
                    .in('order_item_id', orderItemIds);

                if (extrasError) throw extrasError;
            }

            // Delete order items
            const { error: deleteItemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', numericId);

            if (deleteItemsError) throw deleteItemsError;

            // Finally, delete the order
            const { data: deletedOrder, error: deleteOrderError } = await supabase
                .from('orders')
                .delete()
                .eq('id', numericId)
                .select();

            if (deleteOrderError) throw deleteOrderError;

            if (!deletedOrder || deletedOrder.length === 0) {
                throw new Error('Order deletion failed - no rows affected');
            }

            return true;
        } catch (error) {
            console.error('[orderService] Error deleting order:', error);
            throw error;
        }
    },

    async confirmOrder(orderId: string, estimatedTime: string) {
        try {
            // Convert orderId to number if needed
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

            // Get full order details including items
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        menu_items (name, price),
                        order_item_extras (*)
                    )
                `)
                .eq('id', numericId)
                .single();

            if (fetchError) throw fetchError;
            if (!order) throw new Error('Order not found');

            // Extract minutes from estimatedTime string (e.g., "40 Minuten" -> 40)
            const minutesMatch = estimatedTime.match(/\d+/);
            const estimatedMinutes = minutesMatch ? parseInt(minutesMatch[0], 10) : 40;

            // Update order status to pending (confirmed) and save estimated minutes
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    status: 'pending',
                    estimated_minutes: estimatedMinutes
                })
                .eq('id', numericId);

            if (updateError) throw updateError;

            // Prepare items for email
            const emailItems = order.order_items.map((item: any) => ({
                name: item.menu_items.name,
                quantity: item.quantity,
                size: { name: item.size_name || 'Standard' },
                extras: item.order_item_extras?.map((e: any) => ({ name: e.extra_name })) || [],
                totalPrice: item.price
            }));

            // Send confirmation emails
            console.log('[orderService] Sending order confirmation emails after admin confirmation...');
            await sendOrderEmails({
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address,
                order_number: order.id.toString(),
                items: emailItems,
                subtotal: order.subtotal,
                delivery_fee: order.delivery_fee,
                discounts: [],
                discount_amount: 0,
                total_amount: order.total_amount,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                notes: order.notes,
                estimated_delivery_time: estimatedTime
            });

            return { success: true, order };
        } catch (error) {
            console.error('[orderService] Error confirming order:', error);
            throw error;
        }
    },

    async declineOrder(orderId: string) {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

            // Get full order details including items before updating status
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        menu_items (name, price),
                        order_item_extras (*)
                    )
                `)
                .eq('id', numericId)
                .single();

            if (fetchError) throw fetchError;
            if (!order) throw new Error('Order not found');

            // Update order status to cancelled
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', numericId);

            if (error) throw error;
            
            console.log(`[orderService] Order #${numericId} status updated to 'cancelled'`);

            // Prepare items for email
            const emailItems = order.order_items.map((item: any) => ({
                name: item.menu_items.name,
                quantity: item.quantity,
                size: { name: item.size_name || 'Standard' },
                extras: item.order_item_extras?.map((e: any) => ({ name: e.extra_name })) || [],
                totalPrice: item.price
            }));

            // Send cancellation email to customer
            console.log('[orderService] Sending order cancellation email...');
            const { sendOrderCancellationEmail } = await import('./emailService');
            await sendOrderCancellationEmail({
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address,
                order_number: order.id.toString(),
                items: emailItems,
                subtotal: order.subtotal,
                delivery_fee: order.delivery_fee,
                discounts: [],
                discount_amount: 0,
                total_amount: order.total_amount,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                notes: order.notes
            });

            console.log('[orderService] Cancellation email sent...');

            return { success: true };
        } catch (error) {
            console.error('[orderService] Error declining order:', error);
            throw error;
        }
    }
};

// Settings Service
export const settingsService = {
    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('restaurant_settings')
                .select('*')
                .order('setting_key');

            if (error) throw error;

            // Convert key-value rows to object
            const settings: any = {};
            data?.forEach((item: any) => {
                settings[item.setting_key] = item.setting_value;
            });

            return settings;
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Return default values if fetch fails
            return {
                minimum_order_value: '50.00',
                delivery_fee: '2.50'
            };
        }
    },

    async updateSettings(updates: any) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Update/Insert each setting individually using upsert
            const updatePromises = Object.entries(updates).map(async ([key, value]) => {
                // Skip metadata fields
                if (key === 'updated_by' || key === 'updated_at') return;

                // Use upsert to insert if not exists, update if exists
                const { data, error } = await supabase
                    .from('restaurant_settings')
                    .upsert({
                        setting_key: key,
                        setting_value: String(value),
                        updated_by: user?.id
                    }, {
                        onConflict: 'setting_key'
                    })
                    .select();

                if (error) throw error;
                return data;
            });

            await Promise.all(updatePromises);
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // Discount/Promotion management methods (using promotions table)
    async getAllDiscounts(): Promise<Discount[]> {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching promotions:', error);
                return [];
            }

            // Map database columns to Discount interface
            return (data || []).map((promo: any) => ({
                id: promo.id,
                name: promo.name,
                percentage: promo.percentage,
                startDate: promo.start_date,
                endDate: promo.end_date,
                enabled: promo.enabled
            }));
        } catch (error) {
            console.error('Error fetching promotions:', error);
            return [];
        }
    },

    async saveDiscounts(_discounts: Discount[]): Promise<void> {
        // This method is deprecated - use createDiscount, updateDiscount, deleteDiscount instead
        console.warn('saveDiscounts is deprecated, use individual CRUD methods');
    },

    async createDiscount(discount: Omit<Discount, 'id'>): Promise<Discount | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('promotions')
                .insert({
                    name: discount.name,
                    percentage: discount.percentage,
                    start_date: discount.startDate,
                    end_date: discount.endDate,
                    enabled: discount.enabled,
                    created_by: user?.id,
                    updated_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                name: data.name,
                percentage: data.percentage,
                startDate: data.start_date,
                endDate: data.end_date,
                enabled: data.enabled
            };
        } catch (error) {
            console.error('Error creating promotion:', error);
            throw error;
        }
    },

    async updateDiscount(id: string, discount: Partial<Omit<Discount, 'id'>>): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const updateData: any = {
                updated_by: user?.id
            };

            if (discount.name !== undefined) updateData.name = discount.name;
            if (discount.percentage !== undefined) updateData.percentage = discount.percentage;
            if (discount.startDate !== undefined) updateData.start_date = discount.startDate;
            if (discount.endDate !== undefined) updateData.end_date = discount.endDate;
            if (discount.enabled !== undefined) updateData.enabled = discount.enabled;

            const { error } = await supabase
                .from('promotions')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating promotion:', error);
            throw error;
        }
    },

    async deleteDiscount(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting promotion:', error);
            throw error;
        }
    },

    async getActiveDiscount(): Promise<Discount | null> {
        try {
            const now = new Date();

            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('enabled', true);

            if (error) {
                console.error('Error getting active promotion:', error);
                return null;
            }

            if (!data || data.length === 0) return null;

            // Filter in memory to handle null dates (null start_date = active immediately, null end_date = never expires)
            const activePromotions = data.filter((promo: any) => {
                // Check start date (if exists, must be in past or now)
                if (promo.start_date) {
                    const startDate = new Date(promo.start_date);
                    if (now < startDate) return false;
                }

                // Check end date (if exists, must be in future or now)
                if (promo.end_date) {
                    const endDate = new Date(promo.end_date);
                    if (now > endDate) return false;
                }

                return true;
            });

            // Sort by percentage (highest first) and take the best one
            activePromotions.sort((a: any, b: any) => b.percentage - a.percentage);
            const bestPromo = activePromotions[0];

            if (!bestPromo) return null;

            return {
                id: bestPromo.id,
                name: bestPromo.name,
                percentage: bestPromo.percentage,
                startDate: bestPromo.start_date,
                endDate: bestPromo.end_date,
                enabled: bestPromo.enabled
            };
        } catch (error) {
            console.error('Error getting active promotion:', error);
            return null;
        }
    },

    async getAllActiveDiscounts(): Promise<Discount[]> {
        try {
            const now = new Date();

            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('enabled', true);

            if (error) {
                console.error('Error getting active promotions:', error);
                return [];
            }

            if (!data || data.length === 0) return [];

            // Filter in memory to handle null dates (null start_date = active immediately, null end_date = never expires)
            const activePromotions = data.filter((promo: any) => {
                // Check start date (if exists, must be in past or now)
                if (promo.start_date) {
                    const startDate = new Date(promo.start_date);
                    if (now < startDate) return false;
                }

                // Check end date (if exists, must be in future or now)
                if (promo.end_date) {
                    const endDate = new Date(promo.end_date);
                    if (now > endDate) return false;
                }

                return true;
            });

            // Sort by percentage (highest first) for consistent display
            activePromotions.sort((a: any, b: any) => b.percentage - a.percentage);

            return activePromotions.map((promo: any) => ({
                id: promo.id,
                name: promo.name,
                percentage: promo.percentage,
                startDate: promo.start_date,
                endDate: promo.end_date,
                enabled: promo.enabled
            }));
        } catch (error) {
            console.error('Error getting active promotions:', error);
            return [];
        }
    },

    // Delivery Area Management
    async getDeliveryAreas() {
        try {
            const { data, error } = await supabase
                .from('restaurant_settings')
                .select('id, plz, city')
                .not('plz', 'is', null)
                .not('city', 'is', null)
                .order('plz');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching delivery areas:', error);
            return [];
        }
    },

    async addDeliveryArea(plz: string, city: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('restaurant_settings')
                .insert({
                    plz: plz.trim(),
                    city: city.trim(),
                    updated_by: user?.id
                })
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding delivery area:', error);
            throw error;
        }
    },

    async updateDeliveryArea(id: string, plz: string, city: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('restaurant_settings')
                .update({
                    plz: plz.trim(),
                    city: city.trim(),
                    updated_by: user?.id
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating delivery area:', error);
            throw error;
        }
    },

    async deleteDeliveryArea(id: string) {
        try {
            const { error } = await supabase
                .from('restaurant_settings')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting delivery area:', error);
            throw error;
        }
    }
};

// Stammkunden Service
export const stammkundenService = {
    async searchByPhone(phone: string) {
        const normalizedPhone = phone.replace(/\s+/g, '');

        const { data, error } = await supabase
            .from('stammkunden')
            .select('*')
            .eq('phone', normalizedPhone)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getAllStammkunden() {
        const { data, error } = await supabase
            .from('stammkunden')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async searchStammkundenByPhone(query: string) {
        const normalizedQuery = query.replace(/\s+/g, '').toLowerCase();

        // Get all customers and filter client-side to handle spaces
        const { data, error } = await supabase
            .from('stammkunden')
            .select('*')
            .order('name');

        if (error) throw error;

        // Filter by normalizing phone numbers (removing spaces) for comparison
        const filtered = (data || []).filter((customer: any) => {
            const normalizedPhone = customer.phone.replace(/\s+/g, '').toLowerCase();
            return normalizedPhone.startsWith(normalizedQuery);
        });

        return filtered;
    },

    async createStammkunde(stammkundeData: any) {
        const { data, error } = await supabase
            .from('stammkunden')
            .insert([stammkundeData])
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateStammkunde(id: string, updates: any) {
        const { data, error } = await supabase
            .from('stammkunden')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteStammkunde(id: string) {
        const { error } = await supabase
            .from('stammkunden')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Extras Service
export const extrasService = {
    async getExtrasForMenuItem(menuItemId: string) {
        console.log('[extrasService] Fetching extras for menu item:', menuItemId);

        const { data, error } = await supabase
            .from('menu_item_extras')
            .select(`
                extra_id,
                extras (
                    id,
                    name,
                    price,
                    category,
                    available
                )
            `)
            .eq('menu_item_id', menuItemId);

        if (error) {
            console.error('[extrasService] Error fetching extras:', error);
            throw error;
        }

        // Flatten the structure and filter available extras
        const extras = data
            ?.map((item: any) => item.extras)
            .filter((extra: any) => extra && extra.available) || [];

        console.log('[extrasService] Found extras:', extras.length);
        return extras;
    },

    async getAllExtras() {
        console.log('[extrasService] Fetching all extras...');

        const { data, error } = await supabase
            .from('extras')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            console.error('[extrasService] Error fetching all extras:', error);
            throw error;
        }

        console.log('[extrasService] Fetched all extras:', data?.length || 0);
        return data || [];
    }
};

export async function uploadMenuImage(file: File) {
    console.log('[uploadMenuImage] Uploading file:', file.name);

    if (!supabase.storage) {
        console.warn('[uploadMenuImage] Storage not available (mock mode)');
        return URL.createObjectURL(file);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('[uploadMenuImage] Error uploading:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Opening Hours Service
export const openingHoursService = {
    async getOpeningHours(): Promise<OpeningHour[]> {
        try {
            const { data, error } = await supabase
                .from('opening_hours')
                .select('*')
                .order('day_of_week', { ascending: true })
                .order('period_index', { ascending: true });

            if (error) {
                console.error('Error fetching opening hours:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching opening hours:', error);
            return [];
        }
    },

    async updateDayHours(day: number, periods: OpeningPeriod[], isClosed: boolean = false): Promise<void> {
        try {
            // Delete existing periods for this day
            const { error: deleteError } = await supabase
                .from('opening_hours')
                .delete()
                .eq('day_of_week', day);

            if (deleteError) throw deleteError;

            // If day is closed, insert a single closed record
            if (isClosed) {
                const { error: insertError } = await supabase
                    .from('opening_hours')
                    .insert([{
                        day_of_week: day,
                        period_index: 0,
                        start_time: '00:00',
                        end_time: '00:00',
                        is_closed: true
                    }]);

                if (insertError) throw insertError;
                return;
            }

            // Insert new periods
            if (periods.length > 0) {
                const records = periods.map((period, index) => ({
                    day_of_week: day,
                    period_index: index,
                    start_time: period.start,
                    end_time: period.end,
                    is_closed: false
                }));

                const { error: insertError } = await supabase
                    .from('opening_hours')
                    .insert(records);

                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Error updating opening hours:', error);
            throw error;
        }
    },

    async updateAllHours(hoursData: Record<number, { periods: OpeningPeriod[], isClosed: boolean }>): Promise<void> {
        try {
            // Update each day
            for (const [day, data] of Object.entries(hoursData)) {
                await this.updateDayHours(parseInt(day), data.periods, data.isClosed);
            }
        } catch (error) {
            console.error('Error updating all opening hours:', error);
            throw error;
        }
    }
};
