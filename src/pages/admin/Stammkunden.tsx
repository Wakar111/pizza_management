import { useState, useEffect, useMemo } from 'react';
import { stammkundenService } from '../../lib/supabase';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

interface Stammkunde {
    id: string;
    name: string;
    phone: string;
    address: string;
    email?: string;
    notes?: string;
    created_at: string;
}

export default function Stammkunden() {
    const [customers, setCustomers] = useState<Stammkunde[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Stammkunde | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        notes: ''
    });
    const [saving, setSaving] = useState(false);

    // Confirm Dialog State
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await stammkundenService.getAllStammkunden();
            setCustomers(data);
        } catch (error: any) {
            console.error('[AdminStammkunden] Error loading customers:', error);
            showNotification('Fehler beim Laden der Stammkunden: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customers;
        const query = searchQuery.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.address.toLowerCase().includes(query)
        );
    }, [customers, searchQuery]);

    const handleOpenModal = (customer?: Stammkunde) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                email: customer.email || '',
                notes: customer.notes || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
                address: '',
                email: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
            name: '',
            phone: '',
            address: '',
            email: '',
            notes: ''
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            // Basic validation
            if (!formData.name || !formData.phone || !formData.address) {
                showNotification('Bitte füllen Sie alle Pflichtfelder aus.', 'error');
                return;
            }

            // Normalize phone number (remove spaces)
            const normalizedPhone = formData.phone.replace(/\s+/g, '');
            const dataToSave = { ...formData, phone: normalizedPhone };

            if (editingCustomer) {
                const updated = await stammkundenService.updateStammkunde(editingCustomer.id, dataToSave);
                setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
                showNotification('Stammkunde erfolgreich aktualisiert', 'success');
            } else {
                // Check if phone already exists
                const existing = await stammkundenService.searchByPhone(normalizedPhone);
                if (existing) {
                    showNotification('Ein Kunde mit dieser Telefonnummer existiert bereits.', 'error');
                    return;
                }

                const created = await stammkundenService.createStammkunde(dataToSave);
                setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                showNotification('Stammkunde erfolgreich angelegt', 'success');
            }
            handleCloseModal();
        } catch (error: any) {
            console.error('[AdminStammkunden] Error saving customer:', error);
            showNotification('Fehler beim Speichern: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (customerId: string) => {
        setCustomerToDelete(customerId);
        setShowConfirmDialog(true);
    };

    const deleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            await stammkundenService.deleteStammkunde(customerToDelete);
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
            showNotification('Stammkunde erfolgreich gelöscht', 'success');
        } catch (error: any) {
            console.error('[AdminStammkunden] Error deleting customer:', error);
            showNotification('Fehler beim Löschen: ' + error.message, 'error');
        } finally {
            setShowConfirmDialog(false);
            setCustomerToDelete(null);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    return (
        <div className="admin-stammkunden-page">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Stammkunden</h1>
                        <p className="text-gray-600">Verwalten Sie Ihre Kundenkartei.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Neuer Kunde
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Suchen nach Name, Telefon oder Adresse..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Customers List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="mt-4 text-gray-600">Lade Stammkunden...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-medium text-gray-900">Keine Stammkunden gefunden</h3>
                        <p className="text-gray-500 mt-2">
                            {searchQuery
                                ? `Keine Ergebnisse für "${searchQuery}".`
                                : 'Legen Sie Ihren ersten Stammkunden an.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <li key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <div className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-lg font-medium text-primary-900 truncate">
                                                    {customer.name}
                                                </h3>
                                                <span className="text-xs text-gray-400">
                                                    Kunde seit {new Date(customer.created_at).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                    </svg>
                                                    {customer.phone}
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="truncate">{customer.address}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center">
                                                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                        </svg>
                                                        {customer.email}
                                                    </div>
                                                )}
                                            </div>
                                            {customer.notes && (
                                                <div className="mt-2 text-sm text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                    <span className="font-medium text-yellow-800">Notiz:</span> {customer.notes}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex items-center space-x-3">
                                            <button
                                                onClick={() => handleOpenModal(customer)}
                                                className="text-gray-400 hover:text-primary-600 transition-colors"
                                                title="Bearbeiten"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(customer.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Löschen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingCustomer ? 'Stammkunde bearbeiten' : 'Neuer Stammkunde'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="Max Mustermann"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="0123 456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="Musterstraße 1, 12345 Musterstadt"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="max@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notizen (Optional)</label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="Zusätzliche Infos..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Speichern...' : 'Speichern'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    show={showConfirmDialog}
                    title="Stammkunde löschen"
                    message="Sind Sie sicher, dass Sie diesen Stammkunden unwiderruflich löschen möchten?"
                    confirmText="Löschen"
                    type="danger"
                    onConfirm={deleteCustomer}
                    onCancel={() => setShowConfirmDialog(false)}
                />

                <Toast
                    show={showToast}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            </div>
        </div>
    );
}
