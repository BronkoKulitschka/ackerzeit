# Ackerzeit · Farm Manager 0.2.0

Ein deutschsprachiges Browser-Farmspiel mit isometrischer 3D-Hofansicht und saisonaler Hofverwaltung. Weiterentwicklung des vorhandenen Ackerzeit 0.1.1, keine separate Demo. HTML, CSS und JavaScript; alle 3D-Abhängigkeiten und das Farmall-Modell liegen im Paket. Zum Spielen wird kein npm-Build und kein CDN benötigt.

## Neu: der Farmall auf deinem Hof

- Echte 3D-Ansicht mit dem McCormick Farmall D-320, Hofgebäuden, Feldern und jahreszeitlichen Farben.
- Ziele anklicken oder antippen; der Traktor fährt auf kollisionsgeprüften Wegen um die Hofgebäude. Räder und Lenkung bewegen sich passend dazu.
- Kamera verschieben und zoomen, Nahansicht des Traktors, Hofübersicht, Pause und Stopp.
- Auf dem Smartphone feste untere Navigation und eine in den Bildschirm passende Hofansicht. Lange Verwaltungsansichten und Felddetails scrollen innerhalb ihres Bereichs; die Seite selbst scrollt nicht.
- Gemeinsamer GLB-Modellkatalog für zusätzliche Modelle. Siehe `MODELLKATALOG.md`.
- Optionale Fahrzeugposition im vorhandenen Spielstand. Spielstände aus 0.1.0 und 0.1.1 bleiben lesbar.

Die **freie Fahrt** dient in diesem Schritt der Bewegung auf dem Hof. Sie verbraucht keinen Diesel, bearbeitet keine Felder und lässt die Spielzeit nicht verstreichen. Feldaufträge, Dieselreservierung, Wachstum, Wetter, Einnahmen und Ausgaben laufen weiter über den Tageswechsel. Die vorhandene wirtschaftliche Spielbalance wurde nicht neu kalibriert. Der Farmall ersetzt die bisherige grafische Darstellung des Standardtraktors.

## Update in deinem Termux-Workflow

Lade **ackerzeit-v0.2.0.zip** in den Android-Downloadordner. Dein vorhandenes Ackerzeit-Update-Skript aus 0.1.1 kann dieses Paket verarbeiten:

```bash
bash ~/update.sh ~/storage/downloads/ackerzeit-v0.2.0.zip BronkoKulitschka/ackerzeit
```

Danach den bisherigen Ackerzeit-Spiellink öffnen und neu laden. GitHub Pages braucht gegebenenfalls etwas Zeit, bis der neue Commit veröffentlicht wurde. Falls du einen alten Stand siehst, die Seite vollständig neu laden.

Entpacken von Hand ist nicht notwendig. Das Skript prüft das Paket, übernimmt die Dateien, erstellt einen normalen Commit und pusht in dein Repository. Es führt keinen Force-Push aus. Der Spielstand liegt im Browser auf derselben Adresse; das Update löscht ihn nicht. Ein Export unter **Hilfe → Spielstand exportieren** ist vor Updates sinnvoll.

ZIP-Prüfung ohne Anmeldung oder Upload:

```bash
bash ~/update.sh --check ~/storage/downloads/ackerzeit-v0.2.0.zip
```

Falls das Skript fehlt: Das ZIP enthält `farm-manager/update.sh`. Diese Datei nach `~/update.sh` kopieren. Das Skript ist unverändert gegenüber dem vorliegenden 0.1.1-Repository.

## Bedienung

| Aktion | Bedienung |
|---|---|
| Kamera verschieben | Mit Maus oder einem Finger ziehen |
| Zoomen | Mausrad, zwei Finger oder + / − |
| Nahansicht | Traktor |
| Hofübersicht | Hof |
| Feld verwalten | Auswählen → Feld antippen; alternativ Feldschaltfläche unter der Karte |
| Fahren | Fahren → freie Stelle antippen; alternativ erst den Traktor antippen |
| Anhalten | Stopp; bei fokussierter Karte auch Leertaste oder Escape |
| Pausieren | Pause; Weiter setzt die Bewegung fort |
| Feldauftrag ausführen | Auftrag planen → Nächster Tag |
| Speichern / Übertragen | Automatisch; JSON-Export und -Import unter Hilfe |

Fahrziele in Gebäuden oder außerhalb der Karte werden abgewiesen. Die drei Hofgebäude werden mit Sicherheitsabstand umfahren. Die Lenkung ist eine vereinfachte Bewegung entlang des Fahrwegs; noch keine starre Fahrzeugphysik mit Rückwärtsrangieren oder Ackermann-Lenkung. Dekoration am Kartenrand und zusätzliche Katalogmodelle haben in diesem Schritt keine eigenen Kollisionskörper.

Positionen werden beim Anhalten, Erreichen des Ziels, Verlassen der Hofansicht, Export und Ausblenden der Seite gespeichert. Ein Auftrag wird durch freie Fahrt nicht begonnen oder abgeschlossen. Nach einem Tageswechsel oder Menüwechsel steht der Traktor an seiner zuletzt gespeicherten Position; ein gerade angeklickter Fahrweg wird nicht fortgesetzt.

## Bestehende Hofverwaltung

- Drei eigene Felder mit insgesamt 9 ha und ein kaufbares Feld mit 2 ha.
- Sommergerste und Winterweizen, Aussaatfenster, Überwinterung und Ernte.
- Wetter, vier Jahreszeiten, Bodenfeuchte, Wachstum und Ertragseinflüsse.
- Bodenbearbeitung, Aussaat, Düngung und Ernte per Lohnunternehmer.
- 8 Arbeitsstunden pro Tag, Auftragswarteschlange und Stornierung.
- Diesel, Saatgut, Dünger, Traktorverschleiß und Wartung.
- Lager, saisonale Verkaufspreise, Lagerausbau, Kredite und Buchungen.

Zu Beginn im März die Felder bearbeiten, Sommergerste säen und düngen. Im Sommer reife Bestände durch den Lohnunternehmer ernten und verkaufen. Im September/Oktober Winterweizen bestellen. Wetterbedingte Pausen in der Arbeitsplanung beachten. „Bis zu 7 Tage“ hält bei wichtigen Ereignissen an.

## Lokal starten

Für die 3D-Module und GLB-Dateien ist ein HTTP-Server erforderlich. `index.html` direkt als `file://` zu öffnen reicht nicht aus.

```bash
cd ~/ackerzeit-repos/BronkoKulitschka/ackerzeit
python -m http.server 8000 --bind 127.0.0.1
```

Im Browser `http://127.0.0.1:8000` öffnen. In Termux den Server weiterlaufen lassen, mit Strg+C beenden. Spielstände auf localhost und GitHub Pages sind getrennt; dafür den JSON-Export verwenden.

Benötigt einen Browser mit WebGL 2 und ES-Modulen/Import Maps. Falls 3D nicht gestartet werden kann, bleiben die Verwaltungsmenüs nutzbar. Externe Internetverbindungen zum Nachladen von Bibliotheken sind nicht nötig. Dies ist noch keine installierbare Offline-PWA.

## Projektstruktur

| Datei | Aufgabe |
|---|---|
| `index.html`, `style.css` | App-Oberfläche mit fester Bildschirmhöhe |
| `engine.js` | Bestehende Simulation; gegenüber 0.1.1 unverändert |
| `app.js` | Menüs, Aktionen, Speichern und Verbindung zur 3D-Ansicht |
| `farm3d.js` | Szene, Touch-Bedienung, Kamera und Fahrzeugdarstellung |
| `world.js` | Kartenlayout, Hindernisse, Wegfindung und Positionsprüfung |
| `model-loader.js` | GLB-Import und wiederverwendete Modellressourcen |
| `data/models.json` | Modellkatalog und Platzierungen |
| `assets/models/` | GLB-Modelle und Vorschaubilder |
| `vendor/three/` | Lokal gebündelte Three.js-Version 0.180.0 samt MIT-Lizenz |
| `update.sh` | Vorhandener Termux-Update-Workflow |
| `release-manifest.json` | Paketliste und SHA-256-Prüfsummen |
| `tests/` | Automatisierte Simulationstests und 3D-Wegfindungstests |

Die alte Pixelkarten-Datei `isometric.js` wird durch `farm3d.js` und `world.js` ersetzt. Veraltete Dateien aus dem früheren Release-Manifest werden vom Update-Skript kontrolliert entfernt. Andere eigene Dateien bleiben erhalten.

Tests:

```bash
node --test tests/*.test.cjs
```

Der konkrete Prüfumfang und offene Grenzen stehen in `TESTBERICHT.md`.

## Noch nicht enthalten

Ankuppeln, Transport und Laden, 3D-Anbaugeräte, steuerbare zusätzliche Fahrzeuge, frei platzierbare Gebäude, Tiere und Personal sind nächste Ausbauschritte. Kartenflächen sind eine übersichtliche Darstellung und keine maßstabsgetreue Abbildung der angegebenen Hektar. Wirtschaft, Wetter und Pflanzenwachstum bleiben vereinfachte Spielmodelle.

Für viele gleichzeitig sichtbare Modelle können später reduzierte Detailstufen und zusammengefasste Materialien nötig werden. Der Farmall enthält rund 23.000 Dreiecke. Die Darstellung ist auf maximal 30 Bilder pro Sekunde begrenzt, die Pixelauflösung auf höchstens 1,5-fache Geräteauflösung. Bei unsichtbarem Tab oder nach Verlassen der Hofansicht wird die Animationsschleife beendet. Reduzierte Bewegung im Betriebssystem schaltet automatische Niederschlagspartikel aus; eine ausdrücklich gestartete Fahrt bleibt möglich.
