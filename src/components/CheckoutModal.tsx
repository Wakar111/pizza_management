import React, { useState, useEffect } from 'react';
import { settingsService } from '../lib/supabase';
import { RESTAURANT_INFO } from '../config/restaurant';

interface CheckoutModalProps {
    show: boolean;
    onClose: () => void;
    onNext: (customerData: any) => void;
}

interface DeliveryArea {
    id: string;
    plz: string;
    city: string;
}

export default function CheckoutModal({ show, onClose, onNext }: CheckoutModalProps) {
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        zip: '',
        city: '',
        street: '',
        email: '',
        notes: ''
    });

    const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [loadingAreas, setLoadingAreas] = useState(false);

    const [errors, setErrors] = useState({
        name: '',
        phone: '',
        deliveryArea: '',
        street: '',
        email: ''
    });

    // Load delivery areas when modal opens
    useEffect(() => {
        if (show) {
            // Reset form and load delivery areas
            setOrderType('delivery');
            setSelectedAreaId('');
            setFormData({
                name: '',
                phone: '',
                zip: '',
                city: '',
                street: '',
                email: '',
                notes: ''
            });
            setErrors({
                name: '',
                phone: '',
                deliveryArea: '',
                street: '',
                email: ''
            });
            loadDeliveryAreas();
        }
    }, [show]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (show) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll position
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [show]);

    const loadDeliveryAreas = async () => {
        try {
            setLoadingAreas(true);
            const areas = await settingsService.getDeliveryAreas();
            console.log('[CheckoutModal] Loaded delivery areas:', areas);
            setDeliveryAreas(areas);
        } catch (error) {
            console.error('Error loading delivery areas:', error);
        } finally {
            setLoadingAreas(false);
        }
    };

    if (!show) return null;

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors = {
            name: '',
            phone: '',
            deliveryArea: '',
            street: '',
            email: ''
        };

        let isValid = true;

        // Validate name (should be string, not empty)
        if (!formData.name.trim()) {
            newErrors.name = 'Name ist erforderlich';
            isValid = false;
        }

        // Validate phone (only numbers, spaces, and common phone characters)
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefonnummer ist erforderlich';
            isValid = false;
        } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Telefonnummer darf nur Zahlen enthalten';
            isValid = false;
        }

        // Validate delivery-specific fields only if delivery is selected
        if (orderType === 'delivery') {
            // Validate delivery area selection
            if (!selectedAreaId || !formData.zip || !formData.city) {
                newErrors.deliveryArea = 'Bitte wählen Sie ein Liefergebiet aus';
                isValid = false;
            }

            // Validate street (should be string, not empty)
            if (!formData.street.trim()) {
                newErrors.street = 'Straße ist erforderlich';
                isValid = false;
            }
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = 'E-Mail ist erforderlich';
            isValid = false;
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Ungültige E-Mail-Adresse';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handlePhoneChange = (value: string) => {
        // Allow only numbers, spaces, +, -, (, )
        const sanitized = value.replace(/[^\d\s\-\+\(\)]/g, '');
        setFormData({ ...formData, phone: sanitized });
        // Clear error when user starts typing
        if (errors.phone) {
            setErrors({ ...errors, phone: '' });
        }
    };

    const handleDeliveryAreaChange = (areaId: string) => {
        console.log('[CheckoutModal] Selected area ID:', areaId);
        console.log('[CheckoutModal] Available areas:', deliveryAreas);
        // Convert to string for comparison since select values are always strings
        const selectedArea = deliveryAreas.find(area => String(area.id) === String(areaId));
        console.log('[CheckoutModal] Found area:', selectedArea);

        if (selectedArea) {
            setSelectedAreaId(areaId);
            setFormData({
                ...formData,
                zip: selectedArea.plz,
                city: selectedArea.city
            });
            console.log('[CheckoutModal] Updated form data with PLZ:', selectedArea.plz, 'City:', selectedArea.city);
            // Clear error when user selects
            if (errors.deliveryArea) {
                setErrors({ ...errors, deliveryArea: '' });
            }
        } else {
            setSelectedAreaId('');
            setFormData({
                ...formData,
                zip: '',
                city: ''
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onNext({ ...formData, orderType });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Bestellung aufgeben</h2>

                {/* Order Type Toggle */}
                <div className="mb-6">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setOrderType('delivery')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                                orderType === 'delivery'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🚚 Lieferung
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType('pickup')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                                orderType === 'pickup'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🏃 Abholung
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => {
                                    setFormData({ ...formData, name: e.target.value });
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ihr vollständiger Name"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon* (nur Zahlen)</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => handlePhoneChange(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ihre Telefonnummer"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        {/* Delivery-specific fields */}
                        {orderType === 'delivery' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Liefergebiet (PLZ & Stadt)*</label>
                                    {loadingAreas ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                                            Lade Liefergebiete...
                                        </div>
                                    ) : deliveryAreas.length === 0 ? (
                                        <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                                            ⚠️ Keine Liefergebiete verfügbar. Bitte kontaktieren Sie uns.
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={selectedAreaId}
                                            onChange={e => handleDeliveryAreaChange(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.deliveryArea ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Bitte wählen Sie Ihr Liefergebiet</option>
                                            {deliveryAreas.map(area => (
                                                <option key={area.id} value={area.id}>
                                                    {area.plz} - {area.city}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.deliveryArea && <p className="text-red-500 text-sm mt-1">{errors.deliveryArea}</p>}
                                    {selectedAreaId && (
                                        <p className="text-green-600 text-sm mt-1">
                                            ✓ Lieferung nach {formData.zip} {formData.city} verfügbar
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Straße*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.street}
                                        onChange={e => {
                                            setFormData({ ...formData, street: e.target.value });
                                            if (errors.street) setErrors({ ...errors, street: '' });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.street ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Ihre Straße mit Hausnummer"
                                    />
                                    {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail*</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ihre E-Mail"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Anmerkungen (optional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                rows={2}
                                placeholder="Besondere Wünsche oder Anmerkungen"
                            />
                        </div>

                        {/* Pickup address hint */}
                        {orderType === 'pickup' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Abholadresse</h4>
                                        <p className="text-sm text-blue-800">{RESTAURANT_INFO.address.street}</p>
                                        <p className="text-sm text-blue-800">{RESTAURANT_INFO.address.zip} {RESTAURANT_INFO.address.city}</p>
                                        <p className="text-sm text-blue-800">{RESTAURANT_INFO.address.country}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-medium shadow-md"
                        >
                            Weiter zur Übersicht
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
