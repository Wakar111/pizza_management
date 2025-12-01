import { useState, useEffect } from 'react';
import { settingsService, supabase, type Discount } from '../../lib/supabase';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import OpeningHoursManager from '../../components/OpeningHoursManager';

interface SettingsData {
    min_order_value_free_delivery: number;
    delivery_fee: number;
    estimated_delivery_time: string;
}

export default function Settings() {
    const [settings, setSettings] = useState<SettingsData>({
        min_order_value_free_delivery: 50,
        delivery_fee: 2.50,
        estimated_delivery_time: '40-50'
    });
    const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // Discount State
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [showDiscountForm, setShowDiscountForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [discountForm, setDiscountForm] = useState({
        name: '',
        percentage: 0,
        startDate: '',
        endDate: '',
        enabled: true
    });

    // Confirm Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getSettings();
            console.log('[AdminSettings] Loaded data:', data);
            if (data) {
                const loadedSettings = {
                    min_order_value_free_delivery: typeof data.minimum_order_value === 'number'
                        ? data.minimum_order_value
                        : parseFloat(data.minimum_order_value) || 50,
                    delivery_fee: typeof data.delivery_fee === 'number'
                        ? data.delivery_fee
                        : parseFloat(data.delivery_fee) || 2.50,
                    estimated_delivery_time: data.estimated_delivery_time || '40-50'
                };
                setSettings(loadedSettings);
                setOriginalSettings(loadedSettings);
            }
        } catch (error: any) {
            console.error('[AdminSettings] Error loading settings:', error);
            // Don't show error for mock data missing, just use defaults
            if (!error.message?.includes('mock')) {
                showNotification('Fehler beim Laden der Einstellungen', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadDiscounts = async () => {
        try {
            const data = await settingsService.getAllDiscounts();
            setDiscounts(data);
        } catch (error) {
            console.error('Error loading discounts:', error);
            showNotification('Fehler beim Laden der Rabatte', 'error');
        }
    };

    const handleAddDiscount = async () => {
        if (!discountForm.name || discountForm.percentage <= 0) {
            showNotification('Bitte Name und Rabatt eingeben', 'error');
            return;
        }

        // Only validate date order if both dates are provided
        if (discountForm.startDate && discountForm.endDate) {
            if (new Date(discountForm.endDate) <= new Date(discountForm.startDate)) {
                showNotification('Enddatum muss nach Startdatum liegen', 'error');
                return;
            }
        }

        const discountData = {
            name: discountForm.name,
            percentage: discountForm.percentage,
            startDate: discountForm.startDate ? new Date(discountForm.startDate).toISOString() : null,
            endDate: discountForm.endDate ? new Date(discountForm.endDate).toISOString() : null,
            enabled: discountForm.enabled
        };

        try {
            if (editingDiscount) {
                // Update existing discount
                await settingsService.updateDiscount(editingDiscount.id, discountData);
                showNotification('Rabatt erfolgreich aktualisiert', 'success');
            } else {
                // Create new discount
                await settingsService.createDiscount(discountData);
                showNotification('Rabatt erfolgreich erstellt', 'success');
            }

            // Refresh the list
            await loadDiscounts();

            // Reset form
            setShowDiscountForm(false);
            setEditingDiscount(null);
            setDiscountForm({ name: '', percentage: 0, startDate: '', endDate: '', enabled: true });
        } catch (error) {
            console.error('Error saving discount:', error);
            showNotification('Fehler beim Speichern', 'error');
        }
    };

    const handleEditDiscount = (discount: Discount) => {
        setEditingDiscount(discount);
        setDiscountForm({
            name: discount.name,
            percentage: discount.percentage,
            startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
            endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
            enabled: discount.enabled
        });
        setShowDiscountForm(true);
    };

    const handleDeleteDiscount = (discountId: string) => {
        setDiscountToDelete(discountId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!discountToDelete) return;

        try {
            await settingsService.deleteDiscount(discountToDelete);
            showNotification('Rabatt gelöscht', 'success');
            // Refresh the list
            await loadDiscounts();
        } catch (error) {
            console.error('Error deleting discount:', error);
            showNotification('Fehler beim Löschen', 'error');
        } finally {
            setShowConfirmModal(false);
            setDiscountToDelete(null);
        }
    };


    const getDiscountStatus = (discount: Discount) => {
        if (!discount.enabled) return 'disabled';

        const now = new Date();

        // Check start date (null means active immediately)
        if (discount.startDate) {
            const start = new Date(discount.startDate);
            if (now < start) return 'scheduled';
        }

        // Check end date (null means never expires)
        if (discount.endDate) {
            const end = new Date(discount.endDate);
            if (now > end) return 'expired';
        }

        return 'active';
    };

    const hasChanges = () => {
        if (!originalSettings) return false;
        return settings.min_order_value_free_delivery !== originalSettings.min_order_value_free_delivery ||
            settings.delivery_fee !== originalSettings.delivery_fee ||
            settings.estimated_delivery_time !== originalSettings.estimated_delivery_time;
    };

    const resetSettings = () => {
        if (originalSettings) {
            setSettings({ ...originalSettings });
            showNotification('Änderungen zurückgesetzt', 'info');
        }
    };

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges()) return;

        try {
            setSaving(true);

            // Get current user for logging (optional, but good practice)
            const { data: { user } = {} } = await supabase.auth.getUser();

            // Update settings using the correct database column names
            await settingsService.updateSettings({
                minimum_order_value: settings.min_order_value_free_delivery,
                delivery_fee: settings.delivery_fee,
                estimated_delivery_time: settings.estimated_delivery_time,
                updated_by: user?.id,
                updated_at: new Date().toISOString()
            });

            setOriginalSettings({ ...settings });
            showNotification('Einstellungen erfolgreich gespeichert', 'success');
        } catch (error: any) {
            console.error('[AdminSettings] Error saving settings:', error);
            showNotification('Fehler beim Speichern: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        loadSettings();
        loadDiscounts();
    }, []);

    return (
        <div className="admin-settings-page">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Einstellungen</h1>
                    <p className="text-gray-600">Verwalten Sie globale Einstellungen für Ihr Restaurant.</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="mt-4 text-gray-600">Lade Einstellungen...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Discount Management Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-900">🎁 Rabatt-Aktionen</h2>
                                <button
                                    onClick={() => {
                                        setEditingDiscount(null);
                                        setDiscountForm({ name: '', percentage: 0, startDate: '', endDate: '', enabled: true });
                                        setShowDiscountForm(!showDiscountForm);
                                    }}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    {showDiscountForm ? 'Abbrechen' : '+ Neue Aktion'}
                                </button>
                            </div>

                            {/* Add/Edit Form */}
                            {showDiscountForm && (
                                <div className="mt-6 p-6 bg-amber-50 rounded-lg border border-amber-100">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                        {editingDiscount ? 'Rabatt bearbeiten' : 'Neuer Rabatt'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Aktionsname
                                            </label>
                                            <input
                                                type="text"
                                                value={discountForm.name}
                                                onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                                                placeholder="z.B. Black Friday Sale"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rabatt (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={discountForm.percentage}
                                                onChange={(e) => setDiscountForm({ ...discountForm, percentage: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Aktiviert
                                            </label>
                                            <div className="flex items-center h-[42px]">
                                                <input
                                                    type="checkbox"
                                                    checked={discountForm.enabled}
                                                    onChange={(e) => setDiscountForm({ ...discountForm, enabled: e.target.checked })}
                                                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Startdatum <span className="text-gray-400 font-normal text-xs">(Optional - leer = sofort aktiv)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={discountForm.startDate}
                                                onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Enddatum <span className="text-gray-400 font-normal text-xs">(Optional - leer = unbegrenzt)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={discountForm.endDate}
                                                onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleAddDiscount}
                                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            {editingDiscount ? 'Aktualisieren' : 'Hinzufügen'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Discounts Table */}
                            <div className="mt-6">
                                {discounts.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Keine Rabatt-Aktionen vorhanden</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aktion</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rabatt</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zeitraum</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Aktionen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {discounts.map((discount) => {
                                                    const status = getDiscountStatus(discount);
                                                    const statusColors = {
                                                        active: 'bg-green-100 text-green-800',
                                                        scheduled: 'bg-blue-100 text-blue-800',
                                                        expired: 'bg-gray-100 text-gray-600',
                                                        disabled: 'bg-red-100 text-red-800'
                                                    };
                                                    const statusLabels = {
                                                        active: '✅ Aktiv',
                                                        scheduled: '📅 Geplant',
                                                        expired: '⏰ Abgelaufen',
                                                        disabled: '❌ Deaktiviert'
                                                    };

                                                    return (
                                                        <tr key={discount.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{discount.name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">{discount.percentage}%</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {discount.startDate ? new Date(discount.startDate).toLocaleDateString('de-DE') : 'Sofort'} - {discount.endDate ? new Date(discount.endDate).toLocaleDateString('de-DE') : 'Unbegrenzt'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                                                                    {statusLabels[status]}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right space-x-2">
                                                                <button
                                                                    onClick={() => handleEditDiscount(discount)}
                                                                    className="text-amber-600 hover:text-amber-800 font-medium"
                                                                >
                                                                    Bearbeiten
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDiscount(discount.id)}
                                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                                >
                                                                    Löschen
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Opening Hours Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                                🕐 Öffnungszeiten
                            </h2>
                            <OpeningHoursManager onSave={showNotification} />
                        </div>

                        {/* Delivery Conditions Section */}
                        <form onSubmit={saveSettings} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">Lieferbedingungen</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        💰 Mindestbestellwert für kostenlose Lieferung (€)
                                    </label>
                                    <div className="relative rounded-md shadow-sm max-w-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">€</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.min_order_value_free_delivery}
                                            onChange={(e) => setSettings(prev => ({ ...prev, min_order_value_free_delivery: parseFloat(e.target.value) || 0 }))}
                                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 py-2 border"
                                        />
                                    </div>
                                    {originalSettings && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Aktueller Wert: €{originalSettings.min_order_value_free_delivery.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Ab diesem Bestellwert entfällt die Liefergebühr für den Kunden.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🚚 Liefergebühr (€)
                                    </label>
                                    <div className="relative rounded-md shadow-sm max-w-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">€</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.delivery_fee}
                                            onChange={(e) => setSettings(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
                                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 py-2 border"
                                        />
                                    </div>
                                    {originalSettings && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Aktueller Wert: €{originalSettings.delivery_fee.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Standardgebühr für Lieferungen unter dem Mindestbestellwert.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ⏱️ Geschätzte Lieferzeit (Minuten)
                                    </label>
                                    <div className="relative rounded-md shadow-sm max-w-xs">
                                        <input
                                            type="text"
                                            value={settings.estimated_delivery_time}
                                            onChange={(e) => setSettings(prev => ({ ...prev, estimated_delivery_time: e.target.value }))}
                                            className="block w-full rounded-md border-gray-300 px-3 pr-12 focus:border-primary-500 focus:ring-primary-500 py-2 border"
                                            placeholder="z.B. 40-50 oder 30"
                                        />
                                    </div>
                                    {originalSettings && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Aktueller Wert: {originalSettings.estimated_delivery_time} min
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Geben Sie die geschätzte Lieferzeit ein (z.B. "40-50" für 40-50 Minuten oder "30" für 30 Minuten). Dies wird den Kunden angezeigt.
                                    </p>
                                </div>
                            </div>

                            {/* Example Calculation */}
                            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                                <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center">
                                    📊 Beispiel-Rechnung
                                </h3>
                                <div className="space-y-4">
                                    {/* Scenario 1: Below threshold */}
                                    <div className="bg-white rounded-md p-4 border border-blue-100">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700 font-medium">
                                                Bestellung unter €{settings.min_order_value_free_delivery.toFixed(2)}:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">---</span>
                                                <span className="font-bold text-orange-600">+ €{settings.delivery_fee.toFixed(2)} Liefergebühr</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scenario 2: At or above threshold */}
                                    <div className="bg-white rounded-md p-4 border border-green-100">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700 font-medium">
                                                Bestellung ab €{settings.min_order_value_free_delivery.toFixed(2)}:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">---</span>
                                                <span className="font-bold text-green-600">✅ Kostenlose Lieferung</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={resetSettings}
                                    disabled={!hasChanges() || saving}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${!hasChanges() || saving
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Änderungen verwerfen
                                </button>
                                <button
                                    type="submit"
                                    disabled={!hasChanges() || saving}
                                    className={`px-6 py-2 rounded-lg font-medium text-white transition-colors shadow-sm ${!hasChanges() || saving
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-primary-600 hover:bg-primary-700'
                                        }`}
                                >
                                    {saving ? 'Speichern...' : 'Speichern'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <Toast
                    show={showToast}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            </div>
            <ConfirmModal
                show={showConfirmModal}
                title="Rabatt löschen"
                message="Möchten Sie diesen Rabatt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                confirmText="Löschen"
                cancelText="Abbrechen"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setDiscountToDelete(null);
                }}
            />
        </div>
    );
}
