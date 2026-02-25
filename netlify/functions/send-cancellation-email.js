import nodemailer from 'nodemailer'
import { handleCors } from './utils/cors.js'
import { generateCancellationEmail } from './utils/templates/cancellationEmail.js'

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
    // Restaurant contact info
    const restaurantPhone = process.env.RESTAURANT_PHONE || '06022 2656947'

    // Parse request body
    const body = JSON.parse(event.body)
    const {
      customer_name,
      customer_email,
      order_number,
      items,
      subtotal,
      delivery_fee,
      total_amount,
      notes
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

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Format items list for email
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

    // Customer cancellation email
    const customerMailOptions = {
      from: `"Restaurant Crusty Pizza" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `Bestellung abgelehnt - Restaurant Crusty Pizza - Bestellnummer ${order_number || 'N/A'}`,
      html: generateCancellationEmail({
        customer_name,
        order_number,
        itemsList,
        subtotal,
        delivery_fee,
        total_amount,
        notes,
        restaurantPhone
        })
    }

    // Send email
    await transporter.sendMail(customerMailOptions)

    console.log(`✅ Cancellation email sent successfully for order #${order_number}`)

    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Cancellation email sent successfully'
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send cancellation email',
        details: error.message
      })
    }
  }
}