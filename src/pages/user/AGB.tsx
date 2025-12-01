export default function AGB() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Allgemeine Geschäftsbedingungen</h1>

            <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-8">
                    Stand: Dezember 2024
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Geltungsbereich</h2>
                    <p className="text-gray-700 mb-4">
                        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen über unseren Online-Bestellservice.
                        Mit der Aufgabe einer Bestellung erkennen Sie diese AGB als verbindlich an.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Vertragspartner</h2>
                    <p className="text-gray-700 mb-4">
                        Der Kaufvertrag kommt zustande mit Hot Pizza. Die Kontaktdaten finden Sie in unserem Impressum.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Vertragsschluss</h2>
                    <p className="text-gray-700 mb-4">
                        Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar.
                        Durch Anklicken des Buttons "Kostenpflichtig bestellen" geben Sie eine verbindliche Bestellung ab.
                        Der Vertrag kommt mit der Annahme Ihrer Bestellung durch uns zustande.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Preise und Zahlung</h2>
                    <p className="text-gray-700 mb-4">
                        Alle Preise sind Endpreise und enthalten die gesetzliche Mehrwertsteuer (19%).
                        Die Lieferkosten werden zusätzlich berechnet und sind vor Abschluss der Bestellung ersichtlich.
                    </p>
                    <p className="text-gray-700 mb-4">
                        <strong>Zahlungsmethoden:</strong>
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                        <li>Barzahlung bei Lieferung</li>
                        <li>PayPal (falls verfügbar)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Lieferung</h2>
                    <p className="text-gray-700 mb-4">
                        Die Lieferung erfolgt an die von Ihnen angegebene Lieferadresse.
                        Die angegebene Lieferzeit ist ein ungefährer Richtwert und kann je nach Auslastung variieren.
                    </p>
                    <p className="text-gray-700 mb-4">
                        Bei Nichtannahme der Bestellung ohne vorherige Absage behalten wir uns vor,
                        die entstandenen Kosten in Rechnung zu stellen.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Widerrufsrecht</h2>
                    <p className="text-gray-700 mb-4">
                        Aufgrund der Beschaffenheit der Ware (verderbliche Lebensmittel) besteht gemäß § 312g Abs. 2 Nr. 1 BGB
                        kein Widerrufsrecht.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Gewährleistung</h2>
                    <p className="text-gray-700 mb-4">
                        Sollten Sie mit der Qualität der gelieferten Speisen nicht zufrieden sein,
                        kontaktieren Sie uns bitte umgehend. Wir bemühen uns um eine zufriedenstellende Lösung.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Haftung</h2>
                    <p className="text-gray-700 mb-4">
                        Wir haften nicht für Schäden, die durch unsachgemäße Lagerung der Speisen nach Übergabe entstehen.
                        Verzehren Sie die Speisen zeitnah nach Erhalt.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Allergene und Zusatzstoffe</h2>
                    <p className="text-gray-700 mb-4">
                        Informationen zu Allergenen und Zusatzstoffen erhalten Sie auf Anfrage.
                        Bitte teilen Sie uns Allergien oder Unverträglichkeiten im Notizfeld mit.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Schlussbestimmungen</h2>
                    <p className="text-gray-700 mb-4">
                        Es gilt das Recht der Bundesrepublik Deutschland.
                        Sollten einzelne Bestimmungen dieser AGB unwirksam sein,
                        bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
                    </p>
                </section>

                <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                        <strong>Hinweis:</strong> Diese AGB sind ein Muster und dienen nur als Vorlage.
                        Für eine rechtssichere Version konsultieren Sie bitte einen Rechtsanwalt.
                    </p>
                </div>
            </div>
        </div>
    );
}
