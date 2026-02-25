/**
 * Customer Order Confirmation Email Template
 */

export function generateCustomerOrderEmail({
  customer_name,
  order_number,
  itemsList,
  subtotal,
  discounts = [],
  discount_amount = 0,
  actualDeliveryFee,
  total_amount,
  customer_address,
  customer_phone,
  payment_method,
  payment_status,
  notes,
  estimated_delivery_time,
  order_type = 'delivery'
}) {
  const paymentMethodText = payment_method === 'cash'
    ? 'Barzahlung bei Übergabe'
    : 'Bereits bezahlt';

    const paymentStatusText = payment_status === 'paid'
    ? '✅ Bezahlt'
    : '⏳ Ausstehend';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Restaurant Crusty Pizza</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2 style="color: #1f2937;">Hallo ${customer_name},</h2>
        <p style="color: #4b5563; font-size: 16px;">vielen Dank für Ihre Bestellung bei Restaurant Crusty Pizza!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f97316; margin-top: 0;">Bestelldetails</h3>
          <p><strong>Bestellnummer:</strong> ${order_number || 'N/A'}</p>
          
          <h4 style="color: #1f2937;">Ihre Bestellung:</h4>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace;">${itemsList}</pre>
          
          <div style="border-top: 2px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
            <p style="margin: 5px 0;"><strong>Zwischensumme:</strong> €${subtotal.toFixed(2)}</p>
            ${order_type === 'pickup'
              ? '<p style="margin: 5px 0; color: #10b981; font-weight: bold;">✅ Abholung!</p>'
              : actualDeliveryFee > 0
                ? `<p style="margin: 5px 0;"><strong>Liefergebühr:</strong> €${actualDeliveryFee.toFixed(2)}</p>`
                : '<p style="margin: 5px 0; color: #10b981; font-weight: bold;">✅ Kostenlose Lieferung!</p>'
            }
            ${discounts.length > 0 ? `
              <div style="margin: 10px 0; padding: 10px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981;">
                <p style="margin: 0 0 8px 0; color: #059669; font-weight: bold;">🎁 Angewendete Rabatte:</p>
                ${discounts.map(discount => `
                  <p style="margin: 5px 0 5px 15px; color: #047857;">
                    • ${discount.name}: <strong>-${discount.percentage}%</strong> = <strong>-€${discount.amount.toFixed(2)}</strong>
                  </p>
                `).join('')}
                ${discounts.length > 1 ? `
                  <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #86efac; color: #059669; font-weight: bold;">
                    💰 Gesamt Rabatt: -${discounts.reduce((sum, d) => sum + d.percentage, 0)}% = -€${discount_amount.toFixed(2)}
                  </p>
                ` : ''}
              </div>
            ` : ''}
            <p style="margin: 15px 0 5px 0; font-size: 18px; color: #f97316;"><strong>Gesamtbetrag: €${total_amount.toFixed(2)}</strong></p>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f97316; margin-top: 0;">Lieferadresse</h3>
          <p style="margin: 5px 0;">${customer_address}</p>
          <p style="margin: 5px 0;"><strong>Tel:</strong> ${customer_phone}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Zahlungsmethode:</strong> ${paymentMethodText}</p>
          <p style="margin: 5px 0;"><strong>Zahlungsstatus:</strong> ${paymentStatusText}</p>
          ${notes ? `<p style="margin: 15px 0 5px 0;"><strong>Anmerkungen:</strong></p><p style="margin: 5px 0; font-style: italic;">${notes}</p>` : ''}
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">${order_type === 'pickup' ? '⏰ Geschätzte Abholzeit' : '⏰ Geschätzte Lieferzeit'}</h3>
          <p style="color: #78350f; margin: 0; font-size: 18px; font-weight: bold;">Ca. ${estimated_delivery_time}</p>
          <p style="color: #78350f; margin: 10px 0 0 0; font-size: 14px;">${order_type === 'pickup' ? 'Ihre Bestellung wird gerade frisch zubereitet!' : 'Wir bereiten Ihre Bestellung gerade frisch zu!'}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Vielen Dank für Ihre Bestellung!</p>
          <p style="margin-top: 10px;">Guten Appetit! 🍕</p>
        </div>
      </div>
    </div>
  `;
}
