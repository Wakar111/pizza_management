// Email Service using Node.js Backend
// Backend server handles email sending via Nodemailer

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

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
    total_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
}

// Send order emails via backend
export async function sendOrderEmails(orderData: OrderEmailData) {
    try {
        const response = await fetch(`${API_URL}/api/send-order-emails`, {
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
        // Don't throw error - order should still be processed even if emails fail
    }
}
