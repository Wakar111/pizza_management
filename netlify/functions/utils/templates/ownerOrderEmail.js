/**
 * Owner Order Notification Email Template
 */

export function generateOwnerOrderEmail({
  customer_name,
  customer_email,
  customer_phone,
  customer_address,
  order_number,
  itemsList,
  subtotal,
  discounts = [],
  discount_amount = 0,
  actualDeliveryFee,
  total_amount,
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
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔔 NEUE BESTELLUNG</h1>
          </div>
          
          <div style="padding: 30px; background-color: #fef2f2;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Bestellnummer: ${order_number || 'N/A'}</h2>
              <p style="color: #6b7280;">Bestellzeit: ${new Date().toLocaleString('de-DE')}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Kundeninformationen</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${customer_name}</p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> ${customer_phone}</p>
              <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${customer_email}</p>
              <p style="margin: 15px 0 5px 0;"><strong>Lieferadresse:</strong></p>
              <p style="margin: 5px 0; padding: 10px; background: #f3f4f6; border-radius: 4px;">${customer_address}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Bestellung</h3>
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
                <p style="margin: 15px 0 5px 0; font-size: 20px; color: #dc2626;"><strong>GESAMTBETRAG: €${total_amount.toFixed(2)}</strong></p>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Zahlungsinformationen</h3>
              <p style="margin: 5px 0;"><strong>Zahlungsmethode:</strong> ${paymentMethodText}</p>
              <p style="margin: 5px 0;"><strong>Zahlungsstatus:</strong> ${paymentStatusText}</p>
            </div>
            
            ${notes ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">📝 Kundenanmerkungen</h3>
              <p style="margin: 0; color: #78350f;">${notes}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background: #dcfce7; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #166534; font-weight: bold;">${order_type === 'pickup' ? 'Bitte bereiten Sie die Bestellung vor zur Abholung.' : 'Bitte bereiten Sie die Bestellung vor und liefern Sie sie aus.'}</p>
              <p style="margin: 0; color: #166534; font-weight: bold;">${order_type === 'pickup' ? 'Abholzeit' : 'Lieferzeit'}: ${estimated_delivery_time}</p>
            </div>
          </div>
        </div>
  `;
}
