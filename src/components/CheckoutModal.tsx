import React, { useState, useEffect } from 'react';
import { settingsService } from '../lib/supabase';

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
            onNext(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Bestellung aufgeben</h2>

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
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ihre Telefonnummer"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

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
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.deliveryArea ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.street ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ihre Straße mit Hausnummer"
                            />
                            {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                        </div>

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
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                rows={2}
                                placeholder="Besondere Wünsche oder Anmerkungen"
                            />
                        </div>
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
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium shadow-md"
                        >
                            Weiter zur Übersicht
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
