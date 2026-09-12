# Prüfstand · Ackerzeit 0.1.0

Stand: 12. September 2026.

## Bestanden

- JavaScript-Syntaxprüfung für Spielkern und Oberfläche; Bash-Syntaxprüfung des Upload-Skripts.
- Zehn automatisierte Spielkerntests, ausführbar mit `node --test tests/engine.test.cjs`.
- Durchgehende Simulation über 570 Spieltage: Sommergerstenernte im Juli 2026, Winterweizenernte im Juli 2027, tägliche Prüfung der Spielstandstruktur und erfolgreicher Verkauf beider Ernten.
- Prüfung von Aussaatfenstern, Wetterpausen, achtstündiger Tageskapazität, Teilstornierung, Materialreservierung, Lagergrenzen, Wartung, Kreditlimits, Monatszinsen und Schaltjahren.
- Bedienlogik in einer simulierten DOM-Umgebung: alle Menüs, Planung, Tageswechsel, Einkauf, Kreditaufnahme/-tilgung, Feldkauf, Export, Import, Neuanfang, Wiederherstellung und Umgang mit defekter Speicherung.
- Canvas-Hofkarte erzeugt und visuell geprüft.
- ZIP-Prüfung einschließlich SHA-256-Dateiprüfsummen. Beschädigte Pakete, Pfadtraversal und doppelte ZIP-Einträge werden zurückgewiesen.
- Installation und Aktualisierung in einem lokalen Git-Testrepository. Fremde Dateien bleiben erhalten; nur veraltete, vorher im Projektmanifest erfasste Dateien werden entfernt. Fremdprojekte und symbolische Links in Zielpfaden werden zurückgewiesen.
- Vollständiger Ablauf des Bash-Skripts gegen ein lokales Bare-Git-Repository mit nachgebildeter GitHub-Anmeldung: erster Commit/Push, wiederholter identischer Upload ohne zusätzlichen Commit und Abbruch bei ungesicherten lokalen Änderungen.

## Noch offen

- Die vollständige Oberfläche konnte nicht in einem echten Browser visuell geprüft werden: Der verfügbare Browserzugang blockiert den lokalen Spielserver. Die DOM-Prüfung ersetzt keinen Layout- oder Touch-Test.
- Kein Test auf einem physischen Android-Gerät oder in Termux.
- Kein echter Push in ein GitHub-Repository und keine GitHub-Pages-Veröffentlichung. Repository und Anmeldung werden durch den Nutzer beim ersten Upload eingerichtet.
- Die landwirtschaftlichen Werte sind Spielmodelle. Realistische Ertrags- und Wirtschaftsbilanzen sind noch nicht fachlich kalibriert.

Nach dem ersten Upload bitte insbesondere Lesbarkeit und Bedienung auf dem Smartphone, einen Feldauftrag mit Tageswechsel und das Wiederladen nach Schließen des Browsers ausprobieren. Vor späteren Änderungen den Spielstand als JSON exportieren.
