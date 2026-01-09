import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { RESTAURANT_INFO } from '../config/restaurant';

export interface ReceiptOrderItem {
    id: number;
    name: string;
    quantity: number;
    size: string;
    price: number;
    extras: Array<{ name: string; price: number }>;
}

export interface ReceiptOrder {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_email?: string;
    order_type?: 'delivery' | 'pickup';
    payment_method: string;
    status?: string;
    created_at: string;
    total_amount: number;
    subtotal?: number;
    delivery_fee?: number;
    notes?: string;
    order_items: ReceiptOrderItem[];
}

interface PrintReceiptModalProps {
    show: boolean;
    order: ReceiptOrder | null;
    onClose: () => void;
}

export default function PrintReceiptModal({ show, order, onClose }: PrintReceiptModalProps) {
    const [receiptType, setReceiptType] = useState<'customer' | 'restaurant'>('customer');
    const [printBoth, setPrintBoth] = useState(true);
    const [restaurantInfo] = useState({
        name: RESTAURANT_INFO.name,
        address: RESTAURANT_INFO.address.full,
        phone: RESTAURANT_INFO.contact.phone,
        email: RESTAURANT_INFO.contact.email,
        taxNumber: RESTAURANT_INFO.taxNumber
    });

    // Ref for the printable component
    const printRef = useRef<HTMLDivElement>(null);
    const printBothRef = useRef<HTMLDivElement>(null);

    // Setup react-to-print for single receipt
    const printSingle = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page {
                size: 80mm auto;
                margin: 0;
            }
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
            }
        `,
    });

    // Setup react-to-print for both receipts
    const printDouble = useReactToPrint({
        contentRef: printBothRef,
        pageStyle: `
            @page {
                size: 80mm auto;
                margin: 0;
            }
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
            }
        `,
    });

    // Handle print
    const handlePrint = () => {
        if (printBoth) {
            printDouble();
        } else {
            printSingle();
        }
    };

    // Prevent background scrolling when modal is open and reset checkbox
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
            setPrintBoth(true); // Reset to checked when modal opens
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    // Handle click outside modal to close
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!show || !order) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateSubtotal = () => {
        return order.order_items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const extrasTotal = item.extras.reduce((extraSum, extra) => extraSum + extra.price, 0) * item.quantity;
            return sum + itemTotal + extrasTotal;
        }, 0);
    };

    const subtotal = order.subtotal || calculateSubtotal();
    const deliveryFee = order.delivery_fee || (order.order_type === 'delivery' ? order.total_amount - subtotal : 0);

    // Helper function to render receipt content
    const renderReceiptContent = (type: 'customer' | 'restaurant') => (
        <div className="p-4 text-xs leading-relaxed">
            {/* Restaurant Header - Centered */}
            <div className="text-center mb-3">
                <div className="font-bold text-base">{restaurantInfo.name}</div>
                <div>{restaurantInfo.address.split(',')[0]}</div>
                <div>{restaurantInfo.address.split(',')[1]?.trim() || ''}</div>
                <div className="mt-1">{'*'.repeat(22)}</div>
                <div>Telefon: {restaurantInfo.phone}</div>
                <div>E-Mail: {restaurantInfo.email}</div>
                {type === 'restaurant' && (
                    <div className="text-xs">Steuernr: {restaurantInfo.taxNumber}</div>
                )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Order Info */}
            <div className="mb-2">
                <div>Rechnungsnummer: {order.order_number}</div>
                <div>Rechnungsdatum: {formatDate(order.created_at)}</div>
            </div>

            <div className="mb-2">
                <div>Tisch: {order.order_type === 'pickup' ? 'Abholung' : 'Lieferung'}</div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Order Items */}
            {order.order_items.map((item, index) => (
                <div key={index} className="mb-2">
                    <div className="flex justify-between">
                        <span>{item.quantity} x {item.name}</span>
                        <span className="ml-2">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.size && item.size !== 'Standard' && (
                        <div className="ml-4 text-gray-600">Größe: {item.size}</div>
                    )}
                    {item.extras && item.extras.length > 0 && item.extras.map((extra, i) => (
                        <div key={i} className="ml-4 flex justify-between text-gray-600">
                            <span>+ {extra.name}</span>
                            <span>{extra.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            ))}

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Totals */}
            <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                    <span>Zwischensumme</span>
                    <span>{subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm mb-1">
                        <span>Liefergebühr</span>
                        <span>{deliveryFee.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-base mt-2">
                    <span>Rechnungsbetrag</span>
                    <span>EUR {order.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-xs mt-1 font-semibold">
                    {order.payment_method === 'cash' 
                        ? 'Nicht Bezahlt! - Bar Einnehmen' 
                        : 'Schon bezahlt!'}
                </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Tax Breakdown */}
            <div className="mb-2 text-xs">
                <div className="flex justify-between font-bold mb-1">
                    <span>Steuersatz</span>
                    <span>Netto</span>
                    <span>MwSt</span>
                    <span>Brutto</span>
                </div>
                <div className="flex justify-between">
                    <span>A 19% MwSt</span>
                    <span>{(order.total_amount / 1.19).toFixed(2)}</span>
                    <span>{(order.total_amount - order.total_amount / 1.19).toFixed(2)}</span>
                    <span>{order.total_amount.toFixed(2)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Customer Info - Only for Restaurant Receipt */}
            <div className="mb-2 text-xs">
                <div className="font-bold mb-1">Kundeninformation:</div>
                <div>Name: {order.customer_name}</div>
                <div>Tel: {order.customer_phone}</div>
                {order.customer_email && <div>Email: {order.customer_email}</div>}
                {order.order_type === 'delivery' && (
                    <div>Adresse: {order.customer_address}</div>
                )}
            </div>
            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Notes */}
            {order.notes && (
                <>
                    <div className="mb-2 text-xs">
                        <div className="font-bold">Hinweise:</div>
                        <div>{order.notes}</div>
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-2"></div>
                </>
            )}

            {/* Footer */}
            <div className="text-center mt-4 text-xs">
                <div className="mb-2">{new Date().toLocaleString('de-DE')}</div>
                <div className="mb-2">St.Nr. {restaurantInfo.taxNumber}</div>
                <div className="font-bold mb-2">
                    {type === 'customer' 
                        ? 'Vielen Dank Für Ihren Besuch!' 
                        : 'Kopie für Restaurant'}
                </div>
                {type === 'customer' && (
                    <div className="text-xs">Guten Appetit! 🍕</div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Modal Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
                onClick={handleBackdropClick}
            >
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center print:hidden">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Quittung drucken</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Receipt Type Tabs */}
                    <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 print:hidden">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setReceiptType('customer')}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                    receiptType === 'customer'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <span className="hidden sm:inline">📄 Quittung für Kunde</span>
                                <span className="sm:hidden">📄 Kunde</span>
                            </button>
                            <button
                                onClick={() => setReceiptType('restaurant')}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                    receiptType === 'restaurant'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <span className="hidden sm:inline">🏢 Quittung für Restaurant</span>
                                <span className="sm:hidden">🏢 Restaurant</span>
                            </button>
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
                        <div ref={printRef} className="bg-white shadow-lg mx-auto max-w-full" style={{ width: '80mm', fontFamily: 'monospace' }}>
                            {renderReceiptContent(receiptType)}
                        </div>
                    </div>

                    {/* Hidden div for printing both receipts */}
                    <div className="hidden">
                        <div ref={printBothRef}>
                            <div className="bg-white mx-auto" style={{ width: '80mm', fontFamily: 'monospace' }}>
                                {renderReceiptContent('customer')}
                            </div>
                            <div className="bg-white mx-auto" style={{ width: '80mm', fontFamily: 'monospace', pageBreakBefore: 'always' }}>
                                {renderReceiptContent('restaurant')}
                            </div>
                        </div>
                    </div>

                    {/* Placeholder to close preview div - will be removed */}
                    <div style={{display: 'none'}}>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 print:hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            {/* Checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={printBoth}
                                    onChange={(e) => setPrintBoth(e.target.checked)}
                                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Beide Quittungen drucken</span>
                            </label>
                            
                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                <button
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Drucken
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Recommended Printer Types:
// What to Look For When Buying:
// Essential Features:
// 80mm paper width ✅
// Auto-cutter - Cuts paper automatically after each receipt
// High print speed - At least 150mm/sec
// Connection type - USB + Ethernet is most flexible
// Compatible with Windows/Mac - Check driver support
// ESC/POS command support - Standard for receipt printers
// QZ Tray - that many restaurants use - alternative for printing directly to printer