# Weitere Modelle in Ackerzeit ergänzen

Alle Modelle verwenden **GLB**, Metermaßstab, +Y nach oben und −Z nach vorn. Drehpunkte von Rädern sitzen in den Radmitten. Neue Modelle sollten zum vereinfachten Stil des Farmall passen und für mobile Geräte sparsam aufgebaut sein.

`data/models.json` trennt Modelltypen unter `models` von ihren Platzierungen unter `instances`. Die Ansicht lädt alle dort eingetragenen Platzierungen. Dieselbe GLB wird nur einmal eingelesen, Geometrie und Texturen werden für mehrere starre Instanzen gemeinsam genutzt.

## Ein weiteres sichtbares Objekt

1. Datei z. B. unter `assets/models/anhaenger.glb` hinzufügen.
2. In `models` einen neuen Eintrag ergänzen:

```json
{
  "id": "kleiner-anhaenger",
  "name": "Kleiner Anhänger",
  "category": "trailer",
  "file": "assets/models/anhaenger.glb",
  "scale": 1
}
```

3. In `instances` eine Platzierung ergänzen:

```json
{
  "id": "anhaenger-1",
  "model": "kleiner-anhaenger",
  "position": [-15, 0, 10],
  "rotationY": -1.9
}
```

4. Spiel über HTTP öffnen und kontrollieren. IDs müssen jeweils eindeutig sein. Die oben genannte Anhängerdatei ist ein Beispiel und im aktuellen Paket noch nicht enthalten.

**Dadurch erscheint das Modell auf dem Hof.** Ankuppeln, Ladung und Kauf benötigen zusätzlich die jeweilige Spiellogik. Der derzeitige Fahrcontroller steuert die Instanz `tractor-1`. Weitere Traktoren werden sichtbar geladen, sind aber noch nicht auswählbar oder separat steuerbar. Figuren mit Skelettanimation benötigen später einen passenden Klon- und Animationspfad; der aktuelle Loader ist für starre Fahrzeuge, Geräte und Gebäude vorgesehen.

Neue Gebäude müssen zusätzlich in `world.js` unter `OBSTACLES` für die Wegfindung eingetragen werden. Bei freier Platzierung werden wir diese Hindernisliste zukünftig aus dem Gebäudespielstand ableiten.

## Farmall-Eintrag

- `specs`: Technische Angaben für spätere Fahrzeugauswahl.
- `driving`: Fahrgeschwindigkeit auf der Hofkarte, Sicherheitsradius, Radstand und Radradien.
- `parts`: Namen der sichtbaren Rad- und Lenkknoten.
- `sockets`: Vorbereitete Anschlusspunkte für Fahrer, Anhänger und Geräte.

`speedMps` begrenzt die freie Fahrt auf dem Hof. Das Feld `specs.maxSpeedKmh` ist eine technische Modellangabe; es stellt nicht automatisch die Fahrgeschwindigkeit der Hofansicht ein. Wirtschaftliche Leistung, Verbrauch und Geräteeignung sind noch nicht aus diesem Katalog abgeleitet. Die bestehende Tagesplanung arbeitet weiter mit den Werten in `engine.js`.

## Empfohlene Reihenfolge

1. Kleiner einachsiger Anhänger, Ankuppeln und Abstellen.
2. Beladen und Entladen an Lagerpunkten.
3. Kleines Bodenbearbeitungsgerät und eine sichtbare Feldarbeitsfahrt.
4. Weitere Traktoren samt Fahrzeugauswahl und individuellen Zuständen.
5. Gebäude, Lagererweiterungen und Dekoration.

Jeder Schritt sollte eine vollständig benutzbare Funktion hinzufügen.

## Ein neues ZIP bauen

`release-manifest.json` muss beim Erstellen eines Updates alle mitgelieferten Dateien außer dem Manifest selbst und deren SHA-256-Prüfsummen enthalten. Das Archiv verwendet den Wurzelordner `farm-manager/`. Ein Modell nur in die ZIP zu kopieren, ohne das Manifest neu zu erzeugen, führt beim vorhandenen Update-Skript korrekt zur Ablehnung.

Das aktuelle Update-Skript akzeptiert maximal 20 MB unkomprimierten Paketinhalt und höchstens 1.000 manifestierte Dateien. Diese Grenze reicht für den ersten Umbau. Vor einem späteren, größeren Modellpaket muss der Update-Ablauf gemeinsam angepasst werden.

## Herkunft

Der Farmall ist das eigens für dieses Projekt erstellte Modell. Es nutzt keine Fototexturen; die Beschriftung ist eingebettet. Die Bibliothek Three.js steht unter MIT-Lizenz; der vollständige Lizenztext liegt in `vendor/three/LICENSE`. Die Bibliotheksdateien stammen unverändert aus Three.js 0.180.0.

Das mitgelieferte Werkzeug übernimmt das Erstellen des Manifests und des ZIPs:

```bash
python tools/build-release.py --version 0.2.0
```

Die ZIP liegt danach neben dem Projektordner. Das Werkzeug sammelt die Projektdateien, ausgenommen `.git`, `node_modules`, Python-Caches und ZIPs. Daher Testausgaben und private lokale Dateien außerhalb des Projekts ablegen. Bei einer neuen Versionsnummer auch die sichtbare Versionsangabe und Versionsparameter in `index.html` / `app.js` aktualisieren.
