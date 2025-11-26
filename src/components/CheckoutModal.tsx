import React, { useState } from 'react';

interface CheckoutModalProps {
    show: boolean;
    onClose: () => void;
    onNext: (customerData: any) => void;
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

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Bestellung aufgeben</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihr vollständiger Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihre Telefonnummer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                            <input
                                type="text"
                                required
                                value={formData.zip}
                                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihre PLZ"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihre Stadt"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                            <input
                                type="text"
                                required
                                value={formData.street}
                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihre Straße mit Hausnummer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Ihre E-Mail"
                            />
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
