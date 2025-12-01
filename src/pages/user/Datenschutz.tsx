export default function Datenschutz() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Datenschutzerklärung</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-8">
                    Stand: Dezember 2024
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Datenschutz auf einen Blick</h2>
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">Allgemeine Hinweise</h3>
                    <p className="text-gray-700 mb-4">
                        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten
                        passiert, wenn Sie unsere Website besuchen und unser Online-Bestellsystem nutzen.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Verantwortliche Stelle</h2>
                    <p className="text-gray-700 mb-4">
                        Verantwortlich für die Datenverarbeitung auf dieser Website ist Hot Pizza.
                        Die Kontaktdaten entnehmen Sie bitte unserem Impressum.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Datenerfassung bei Bestellungen</h2>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-amber-900">📊 Welche Daten werden gespeichert?</h3>
                        <p className="text-gray-700 mb-3">
                            Bei jeder Bestellung über unseren Online-Shop werden folgende personenbezogene Daten
                            in unserer Datenbank gespeichert:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                            <li><strong>Name:</strong> Vor- und Nachname für die Lieferung</li>
                            <li><strong>Lieferadresse:</strong> Straße, Hausnummer, PLZ, Ort</li>
                            <li><strong>Telefonnummer:</strong> Zur Kontaktaufnahme bei Rückfragen</li>
                            <li><strong>E-Mail-Adresse:</strong> Für Auftragsbestätigungen und Kommunikation</li>
                            <li><strong>Bestelldaten:</strong> Bestellte Artikel, Mengen, Preise</li>
                            <li><strong>Zahlungsart:</strong> Gewählte Zahlungsmethode (z.B. Barzahlung, PayPal)</li>
                            <li><strong>Zeitstempel:</strong> Datum und Uhrzeit der Bestellung</li>
                            <li><strong>Notizen:</strong> Optionale Anmerkungen zur Bestellung</li>
                        </ul>
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-gray-800">Zweck der Datenverarbeitung</h3>
                    <p className="text-gray-700 mb-4">
                        Die Erhebung und Speicherung Ihrer Daten erfolgt ausschließlich zur:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li>Abwicklung Ihrer Bestellung</li>
                        <li>Lieferung der bestellten Waren</li>
                        <li>Rechnungsstellung und Zahlungsabwicklung</li>
                        <li>Kontaktaufnahme bei Rückfragen</li>
                        <li>Erfüllung rechtlicher Verpflichtungen (z.B. steuerrechtliche Aufbewahrungspflichten)</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 text-gray-800">Rechtsgrundlage</h3>
                    <p className="text-gray-700 mb-4">
                        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung
                        bzw. zur Durchführung vorvertraglicher Maßnahmen.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Stammkundendaten</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                        <p className="text-gray-700 mb-3">
                            Für Stammkunden speichern wir zusätzlich:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 ml-4">
                            <li>Kundennummer</li>
                            <li>Bestellhistorie</li>
                            <li>Gespeicherte Lieferadressen</li>
                        </ul>
                        <p className="text-gray-700 mt-3">
                            Dies dient der Vereinfachung zukünftiger Bestellvorgänge und erfolgt nur mit Ihrer Einwilligung.
                        </p>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Speicherdauer</h2>
                    <p className="text-gray-700 mb-4">
                        Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die Erfüllung der genannten
                        Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li><strong>Bestelldaten:</strong> 10 Jahre (steuerrechtliche Aufbewahrungspflicht)</li>
                        <li><strong>Zahlungsdaten:</strong> 10 Jahre (steuerrechtliche Aufbewahrungspflicht)</li>
                        <li><strong>Stammkundendaten:</strong> Bis zur Löschungsanforderung oder Inaktivität von 3 Jahren</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Weitergabe von Daten</h2>
                    <p className="text-gray-700 mb-4">
                        Eine Weitergabe Ihrer Daten an Dritte erfolgt nur, wenn:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li>Dies zur Vertragserfüllung erforderlich ist (z.B. an Zahlungsdienstleister wie PayPal)</li>
                        <li>Sie ausdrücklich eingewilligt haben</li>
                        <li>Eine gesetzliche Verpflichtung besteht</li>
                    </ul>
                    <p className="text-gray-700 mb-4">
                        Wir verkaufen Ihre Daten nicht an Dritte.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Datensicherheit</h2>
                    <p className="text-gray-700 mb-4">
                        Wir nutzen sichere technische und organisatorische Maßnahmen zum Schutz Ihrer Daten:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li>SSL-Verschlüsselung für die Datenübertragung</li>
                        <li>Sichere Datenbanksysteme (Supabase mit Verschlüsselung)</li>
                        <li>Regelmäßige Sicherheitsupdates</li>
                        <li>Zugangsbeschränkungen für Mitarbeiter</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Ihre Rechte</h2>
                    <p className="text-gray-700 mb-4">
                        Sie haben jederzeit das Recht auf:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li><strong>Auskunft:</strong> Welche Daten wir über Sie gespeichert haben</li>
                        <li><strong>Berichtigung:</strong> Korrektur unrichtiger Daten</li>
                        <li><strong>Löschung:</strong> Löschung Ihrer Daten (soweit keine gesetzlichen Aufbewahrungspflichten bestehen)</li>
                        <li><strong>Einschränkung:</strong> Einschränkung der Verarbeitung</li>
                        <li><strong>Datenübertragbarkeit:</strong> Erhalt Ihrer Daten in einem strukturierten Format</li>
                        <li><strong>Widerspruch:</strong> Widerspruch gegen die Datenverarbeitung</li>
                        <li><strong>Beschwerde:</strong> Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
                    </ul>
                    <p className="text-gray-700 mb-4">
                        Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte über die im Impressum angegebenen Kontaktdaten.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Cookies</h2>
                    <p className="text-gray-700 mb-4">
                        Unsere Website nutzt technisch notwendige Cookies zur Gewährleistung der Funktionalität
                        (z.B. Warenkorbfunktion). Diese Cookies werden automatisch nach dem Schließen Ihres Browsers gelöscht.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. E-Mail-Kommunikation</h2>
                    <p className="text-gray-700 mb-4">
                        Nach Ihrer Bestellung erhalten Sie eine Auftragsbestätigung per E-Mail.
                        Diese enthält Ihre Bestelldaten und wird automatisch an die von Ihnen angegebene E-Mail-Adresse versendet.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Änderungen der Datenschutzerklärung</h2>
                    <p className="text-gray-700 mb-4">
                        Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage oder
                        bei Änderungen des Dienstes anzupassen. Die aktuelle Version ist stets auf dieser Seite verfügbar.
                    </p>
                </section>

                <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                        <strong>Hinweis:</strong> Diese Datenschutzerklärung ist ein Muster und dient nur als Vorlage.
                        Für eine rechtssichere DSGVO-konforme Version konsultieren Sie bitte einen Datenschutzbeauftragten
                        oder Rechtsanwalt.
                    </p>
                </div>
            </div>
        </div>
    );
}
