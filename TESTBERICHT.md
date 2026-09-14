# Prüfbericht · Ackerzeit 0.2.0

Abgeschlossen am 14. September 2026. Grundlage des Umbaus: Git-Commit `07eaa00` (Ackerzeit 0.1.1).

## Simulation und Fahrwege

**14 automatisierte Tests erfolgreich**, ausführbar mit:

```bash
node --test tests/*.test.cjs
```

- Die zehn bisherigen Simulationstests bestehen unverändert. Sie prüfen unter anderem Aussaatfenster, Materialreservierung, Wetterpausen, Tageskapazität, Stornierungen, Lagergrenzen, Wartung, Kredite, Schaltjahre und einen 570-Tage-Anbauzyklus mit Sommergerste und Winterweizen.
- Vier neue Tests prüfen Fahrwege um Gebäude mit Sicherheitsabstand, Ablehnung unerreichbarer Ziele, ungültige Fahrzeugpositionen, den Modellkatalog und die unveränderte Simulation beim Berechnen von Fahrwegen.
- `engine.js` und `update.sh` sind bytegleich mit dem vorhandenen 0.1.1-Repository.
- Das Spielstandformat bleibt 1. `world3d.tractor` ist eine optionale Fahrzeugposition. Spielstände ohne diesen Eintrag funktionieren weiter.

## Tatsächliche Browserprüfung

Headless Chromium 138 mit Software-WebGL (SwiftShader) und Playwright. Die Ansicht wurde im Browser gerendert und als Screenshot geprüft.

| Bildschirm | Seite ohne Überlauf | Fahren / Pause / Stopp | Aufträge / Tageswechsel | Menüs / Speichern / Neuladen |
|---|---|---|---|---|
| 390 × 844 | bestanden | bestanden | bestanden | bestanden |
| 360 × 640 | bestanden | bestanden | bestanden | bestanden |
| 844 × 390 | bestanden | bestanden | bestanden | bestanden |
| 1365 × 900 | bestanden | bestanden | bestanden | bestanden |

- Hochformatprüfungen mit aktivierter Touch-Emulation; Fahrziele tatsächlich per Touch-Ereignis gesetzt.
- Kein horizontaler oder vertikaler Überlauf der gesamten Seite. Lange Verwaltungsbereiche und die Felddetails besitzen einen eigenen Scrollbereich.
- Fahrzeugposition ändert sich bei der Fahrt; Datum, Kontostand und Dieselbestand bleiben dabei unverändert.
- Ein echter Bodenbearbeitungsauftrag wurde geplant und über den Tageswechsel abgeschlossen.
- Alle Verwaltungsmenüs wurden geöffnet. Nach Verlassen des Hofs verbleibt kein Karten-Canvas im sichtbaren Dokument; bei Rückkehr wird genau eine Ansicht eingebunden.
- Gespeicherte Fahrzeugposition und Wirtschaftstag bleiben nach Neuladen erhalten.
- Eine absichtlich beschädigte vorhandene Speicherung wird angezeigt und nicht überschrieben.
- Keine ungefangenen JavaScript-Fehler oder fehlgeschlagenen Netzwerkzugriffe in den vier Prüfläufen.
- Alle Laufzeitressourcen kamen vom lokalen Spielserver oder aus lokalen Blob-/Data-URLs; kein CDN-Zugriff.
- Nach einer visuellen Korrektur bleibt der Traktor auch in der Nahansicht im Querformat vollständig sichtbar.

Der reproduzierbare Browsertest liegt in `tests/browser-check.cjs`. Er benötigt für die Entwicklung Node.js, Playwright und dessen Chromium-Installation, die nicht zum Laufzeitpaket des Spiels gehören:

```bash
node tests/browser-check.cjs
```

Optional kann `PLAYWRIGHT_CHROMIUM_EXECUTABLE` auf eine eigene Chromium-Datei zeigen. Screenshots und Ergebnis-JSON werden standardmäßig im temporären Systemordner `ackerzeit-browser-qa` abgelegt; `ACKERZEIT_TEST_OUTPUT` überschreibt dieses Ziel. Der Test öffnet ausschließlich einen lokalen Server auf Port 8089.

## Modell und Paket

- Der Farmall stammt aus dem bereits erstellten GLB-Modell mit 23.090 Dreiecken und eingebetteter Beschriftung.
- Das Modell war beim Erstellen mit dem Khronos glTF Validator geprüft worden: keine Fehler und keine Warnungen. Zusätzlich wurde der tatsächliche Import in Three.js im Browser erfolgreich geprüft.
- Three.js 0.180.0 liegt mit benötigten Zusatzmodulen und MIT-Lizenz vollständig lokal bei.
- JavaScript-Syntaxprüfung sowie Bash-Syntaxprüfung erfolgreich.
- Das Release verwendet den vom bestehenden Updater erwarteten Ordner `farm-manager/` und ein vollständiges SHA-256-Manifest. Die Paketprüfung mit dem unveränderten `update.sh --check` wurde erfolgreich ausgeführt.

## Grenzen der Prüfung

Kein Test auf einem physischen Android-Gerät, keine Messung der tatsächlichen Geräte-FPS und kein echter Termux-/GitHub-Push. Die Bildschirm- und Touch-Prüfung im Browser ersetzt keinen Hardwaretest. Das fertige ZIP wird vom Nutzer über den bestehenden Termux-Workflow veröffentlicht.

Freie Fahrt ist eine vereinfachte Hofsteuerung. Anhänger, Ankuppeln, Ladung, Anbaugeräte, physikalisches Rangieren und zusätzliche steuerbare Fahrzeuge sind noch nicht enthalten. Die wirtschaftlichen Arbeitswerte bleiben aus 0.1.1 erhalten und sind keine neu kalibrierten Leistungsdaten des Farmall.
