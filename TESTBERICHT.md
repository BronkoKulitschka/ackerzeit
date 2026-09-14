# Prüfbericht · Ackerzeit 0.3.0

14. September 2026. Grundlage: vorhandenes Ackerzeit-Repository, Commit `07eaa00` (0.1.1), darauf der lokale 0.2.0-Umbau mit Farmall und 3D-Hof.

## Simulation und Arbeitsbahnen

**21 automatisierte Tests erfolgreich**, ausführbar mit `node --test tests/*.test.cjs`.

- Zehn vorhandene Simulationstests: Aussaatfenster, Reservierungen, Wetterpausen, Tageskapazität, Stornierungen, Lagergrenzen, Wartung, Kredite, Schaltjahre und ein 570-Tage-Anbauzyklus.
- Vier Prüfungen zu Hindernissen, unerreichbaren Zielen, Fahrzeugpositionen und Modellkatalog.
- Sieben neue Prüfungen: einmalige Reservierung beim Arbeitsbeginn; nur ein aktiver Einsatz; exakter Abschluss ohne doppelte Buchung; Betriebsstunden und Verschleiß bei kleinen Fortschrittsschritten; Unterbrechen und Fortsetzen nach Serialisierung; anteilige Rückerstattung beim Abbrechen; Tageswechsel ohne automatische Auftragserledigung; tägliches Stundenlimit; Wetter- und Zustandsblockaden; alle vier Tätigkeitsarten inklusive Ernte; Übernahme alter geplanter Aufträge ohne erneute Kosten; Arbeitsbahnen innerhalb der Felder und Wiederaufnahme mitten in einer Bahn.

Das Spielstandformat bleibt Version 1 und bekommt optionale Angaben für Tagesstunden sowie laufende und unterbrochene Arbeiten. Die Simulation wurde für direkte Arbeit erweitert. Das Termux-Skript bleibt unverändert.

## Browserprüfung

Headless Chromium 138 mit Software-WebGL (SwiftShader), gesteuert durch Playwright. Tatsächliche Canvas-Darstellung und Screenshots, kein reines HTML-Mockup.

| Bildschirm | Direkt starten und sichtbare Bearbeitung | Unterbrechen, Neuladen, Fortsetzen | Bodenbearbeitung, Aussaat, Tageswechsel |
|---|---|---|---|
| 390 × 844 | bestanden | bestanden | bestanden |
| 844 × 390 | bestanden | bestanden | bestanden |
| 1365 × 900 | bestanden | bestanden | bestanden |

Die Prüfungen bestätigen, dass Feldarbeit vor dem Tageswechsel abgeschlossen wird, Material nur einmal reserviert wird und Arbeitsstunden exakt gebucht werden. Keine ungefangenen JavaScript-Fehler in diesen Läufen. Die gesamte Seite bleibt ohne horizontalen oder vertikalen Überlauf. Hochformat wurde mit mobiler Ansicht und Touch-Unterstützung emuliert.

**Abschließender zusätzlicher Lauf bei 360 × 640 bestanden:** Bodenbearbeitung, Aussaat, Düngung und sichtbare Ernte; Unterbrechen, Neuladen und Fortsetzen; Tageswechsel und Seite ohne Überlauf. Keine ungefangenen JavaScript-Fehler. Die Geräteangaben wurden in diesem Lauf bereits angezeigt.

Reproduzierbar mit `node tests/browser-check.cjs`. Benötigt Node.js, Playwright und Chromium als Entwicklungswerkzeuge. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` kann auf eine eigene Chromium-Datei zeigen. `ACKERZEIT_TEST_OUTPUT` überschreibt den standardmäßigen temporären Ausgabeordner; `ACKERZEIT_TEST_COMPACT=1` führt den erweiterten Test nur bei 360 × 640 aus. Der lokale Testserver läuft auf Port 8089.

## Modell und Paket

Der Farmall ist das zuvor erstellte GLB-Modell mit 23.090 Dreiecken. Bei seiner Erstellung: Khronos glTF Validator ohne Fehler und Warnungen. Der tatsächliche Import in Three.js wurde in den Browserprüfungen bestätigt. Geräte und Mähdrescher sind einfache eigenständige Code-Geometrien.

Die Veröffentlichung verwendet den vom vorhandenen Updater erwarteten Ordner `farm-manager/` und ein vollständiges SHA-256-Manifest. Die abschließende ZIP-Prüfung mit `update.sh --check` wird mit der Paketerstellung ausgeführt.

## Grenzen

Kein physisches Android-Gerät, keine Geräte-FPS-Messung und kein echter Termux-/GitHub-Push. Veröffentlichung durch den Nutzer über den vorhandenen Workflow.

Die Feldarbeit wird von der aktiven 3D-Ansicht ausgeführt und ruht in anderen Menüs sowie ausgeblendeten Tabs. Fahrzeugbewegung, Arbeitsbreiten, Wendebereiche und Geräte sind vereinfacht. Die Darstellung des Lohnunternehmer-Mähdreschers verwendet momentan denselben Bewegungscontroller wie der Farmall; noch keine eigenständige Fuhrpark- oder Transportverwaltung. Die alten wirtschaftlichen Werte wurden nicht als realistische Farmall-Leistungsdaten neu kalibriert. Keine vollständige Nachbildung der FS25-Agronomie oder des Helfersystems.
