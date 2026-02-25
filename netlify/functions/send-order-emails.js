import nodemailer from 'nodemailer'
import { handleCors } from './utils/cors.js'
import { generateCustomerOrderEmail } from './utils/templates/customerOrderEmail.js'
import { generateOwnerOrderEmail } from './utils/templates/ownerOrderEmail.js'

export const handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCors(event)
  if (corsResponse.statusCode) return corsResponse // Preflight response
  const headers = corsResponse.headers

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body)
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      order_number,
      items,
      subtotal,
      delivery_fee,
      discounts = [],
      discount_amount = 0,
      total_amount,
      payment_method,
      payment_status,
      notes,
      estimated_delivery_time = '40-50',
      order_type = 'delivery'
    } = body

    // Validate required fields
    if (!customer_email || !customer_name || !items) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['customer_email', 'customer_name', 'items']
        })
      }
    }

    const actualDeliveryFee = delivery_fee !== undefined ? delivery_fee : (total_amount - subtotal)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Format items list
    const itemsList = items
      .map(item => {
        let itemStr = `${item.quantity}x ${item.name} (${item.size.name})`
        if (item.extras && item.extras.length > 0) {
          const extrasStr = item.extras.map(e => e.name).join(', ')
          itemStr += ` + Extras: ${extrasStr}`
        }
        itemStr += ` - €${(item.totalPrice * item.quantity).toFixed(2)}`
        return itemStr
      })
      .join('\n')

    // Customer email
    const customerMailOptions = {
      from: `"Restaurant Crusty Pizza" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `Ihre Bestellung bei Restaurant Hot Pizza - Bestellnummer ${order_number || 'N/A'}`,
      html: generateCustomerOrderEmail({
        customer_name,
        order_number,
        itemsList,
        subtotal,
        discounts,
        discount_amount,
        actualDeliveryFee,
        total_amount,
        customer_address,
        customer_phone,
        payment_method,
        payment_status,
        notes,
        estimated_delivery_time,
        order_type
      })
    }

    // Owner email
    const ownerMailOptions = {
      from: `"Restaurant Crusty Pizza" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: `🔔 Neue Bestellung - ${order_number || 'N/A'} - ${customer_name}`,
      html: generateOwnerOrderEmail({
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        order_number,
        itemsList,
        subtotal,
        discounts,
        discount_amount,
        actualDeliveryFee,
        total_amount,
        payment_method,
        payment_status,
        notes,
        estimated_delivery_time,
        order_type
      })
    }

    // Send both emails
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(ownerMailOptions)
    ])

    console.log(`✅ Order emails sent successfully for order #${order_number}`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Order emails sent successfully'
      })
    }

  } catch (error) {
    console.error('❌ Error sending order emails:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send emails',
        details: error.message
      })
    }
  }
}