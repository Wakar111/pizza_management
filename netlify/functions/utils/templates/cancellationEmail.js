/**
 * Order Cancellation Email Template
 */

export function generateCancellationEmail({
  customer_name,
  order_number,
  itemsList,
  subtotal,
  delivery_fee,
  total_amount,
  notes,
  restaurantPhone
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Restaurant Crusty Pizza</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2 style="color: #1f2937;">Hallo ${customer_name},</h2>
        <p style="color: #4b5563; font-size: 16px;">leider konnten wir Ihre Bestellung nicht bearbeiten.</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="color: #991b1b; margin-top: 0;">❌ Bestellung wurde abgelehnt</h3>
          <p style="color: #7f1d1d; margin: 0;">Ihre Bestellung konnte leider nicht erfolgreich bearbeitet werden.</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f97316; margin-top: 0;">Ihre Bestelldetails</h3>
          <p><strong>Bestellnummer:</strong> ${order_number || 'N/A'}</p>
          
          <h4 style="color: #1f2937;">Bestellte Artikel:</h4>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace;">${itemsList}</pre>
          
          <div style="border-top: 2px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
            <p style="margin: 5px 0;"><strong>Zwischensumme:</strong> €${subtotal.toFixed(2)}</p>
            ${delivery_fee > 0 ? `<p style="margin: 5px 0;"><strong>Liefergebühr:</strong> €${delivery_fee.toFixed(2)}</p>` : ''}
            <p style="margin: 5px 0; font-size: 18px; color: #f97316;"><strong>Gesamtbetrag: €${total_amount.toFixed(2)}</strong></p>
          </div>
          
          ${notes ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 5px 0;"><strong>Ihre Anmerkungen:</strong></p>
            <p style="margin: 5px 0; font-style: italic; color: #6b7280;">${notes}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">📞 Bitte kontaktieren Sie uns</h3>
          <p style="color: #78350f; margin: 10px 0;">Für weitere Informationen oder um eine neue Bestellung aufzugeben, kontaktieren Sie uns bitte unter:</p>
          <p style="margin: 10px 0;">
            <a href="tel:${restaurantPhone}" style="color: #92400e; font-size: 20px; font-weight: bold; text-decoration: none;">${restaurantPhone}</a>
          </p>
          <p style="color: #78350f; margin: 10px 0;">Wir helfen Ihnen gerne weiter!</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Vielen Dank für Ihr Verständnis!</p>
          <p style="margin-top: 10px;">Restaurant Crusty Pizza Team</p>
        </div>
      </div>
    </div>
  `;
}
