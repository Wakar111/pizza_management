// Email Service using Node.js Backend
// Backend server handles email sending via Nodemailer

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

export interface OrderEmailData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    order_number?: string;
    items: Array<{
        name: string;
        quantity: number;
        size: { name: string };
        extras?: Array<{ name: string }>;
        totalPrice: number;
    }>;
    subtotal: number;
    delivery_fee?: number;
    discounts?: Array<{
        name: string;
        percentage: number;
        amount: number;
    }>;
    discount_amount?: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
    estimated_delivery_time?: string;
}

// Send order emails via backend
export async function sendOrderEmails(orderData: OrderEmailData) {
    try {
        const endpoint = `${API_URL}/send-order-emails`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.details || 'Failed to send emails')
        }

        const result = await response.json()
        console.log('✅ Order emails sent successfully:', result)
        return result
    } catch (error: any) {
        console.error('❌ Error sending order emails:', error)
        // Re-throw error so it can be handled by the order service
        throw error;
    }
}

// Send order cancellation email to customer
export async function sendOrderCancellationEmail(orderData: OrderEmailData) {
    try {
        const endpoint = `${API_URL}/send-cancellation-email`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.details || 'Failed to send cancellation email')
        }

        const result = await response.json()
        console.log('✅ Cancellation email sent successfully:', result)
        return result
    } catch (error: any) {
        console.error('❌ Error sending cancellation email:', error)
        throw error;
    }
}
