# Ackerzeit · Farm Manager 0.3.0

Deutschsprachiges Browser-Farmspiel mit 3D-Hof und saisonaler Hofverwaltung. Dieses Update baut das vorhandene Ackerzeit weiter um: Die separate Arbeitsplanung entfällt. Feldarbeit wird direkt auf der Karte beauftragt und sichtbar ausgeführt.

## Feldarbeit als Management

1. **Feld antippen.** Zustand, Bodenfeuchte und nächster Arbeitsschritt erscheinen direkt am Schlag.
2. **Farmall hinschicken.** Der Traktor fährt zum Feld. Eine Tätigkeit lässt sich auch sofort am Feld auswählen; dann beginnt die Anfahrt automatisch.
3. **Tätigkeit wählen.** Boden bearbeiten, Sommergerste oder Winterweizen säen, düngen oder den Lohnunternehmer zur Ernte bestellen. Bei jeder Tätigkeit stehen Maschine, Gerät, Arbeitsbreite und Kosten beziehungsweise der Grund, warum sie noch nicht möglich ist.
4. **Fahrer arbeitet automatisch.** Die Maschine fährt Bahnen, wendet und verändert das Feld sichtbar. Anbaugeräte werden auf Arbeitsbahnen abgesenkt und bei Anfahrt beziehungsweise Wenden angehoben. Der Fortschritt folgt der tatsächlich gefahrenen Arbeitsstrecke.
5. **Eingreifen.** Am Feld unterbrechen, fortsetzen oder abbrechen. Mit 1× / 4× / 12× beschleunigst du die Darstellung. Nach Abschluss wird der nächste Arbeitsschritt freigegeben.

Derzeit gibt es einen eigenen Farmall und automatisch zugeteilte Geräte. Die Ernte übernimmt ein einfacher sichtbarer Mähdrescher des Lohnunternehmers. Es läuft eine Feldarbeit gleichzeitig. Fahrzeugauswahl aus einem größeren Fuhrpark und mehrere Fahrer sind noch kein Bestandteil dieses Updates.

Die gestalterische Orientierung ist das Helferprinzip von **Farming Simulator 25**. GIANTS beschreibt Arbeitsbreiten nach Gerät, Arbeitsbahnen innerhalb der Feldgrenzen und Einstellungen für das Vorgewende: [Offizielle Vorstellung der FS25-Helfer](https://www.farming-simulator.com/newsArticle.php?news_id=573). Ackerzeit übernimmt daraus die Idee der automatischen Ausführung und übersetzt sie in Feldentscheidungen für ein Managementspiel. Die jetzigen rechteckigen Arbeitsbahnen haben einen vereinfachten Wendebereich; einstellbare Vorgewende, frei wählbare Bahnrichtungen und vollständige FS25-Feldmechaniken sind noch nicht umgesetzt. Es werden eigene Modelle und eigener Code verwendet.

## Zeit, Verbrauch und Spielstand

- **8 Arbeitsstunden pro Tag:** Tatsächlicher Arbeitsfortschritt belastet Tagesbudget, Betriebsstunden und Traktorverschleiß. Am Limit wartet die Arbeit auf den nächsten Tag.
- **Tageswechsel:** Pflanzen wachsen, Bodenfeuchte und Wetter ändern sich. Der Knopf erledigt keine direkten Feldarbeiten mehr im Hintergrund.
- **Betriebsmittel:** Bei Arbeitsbeginn werden Kosten, Diesel, Saatgut und Dünger einmal reserviert. Beim Abbrechen wird nur der ungenutzte Anteil zurückgegeben. Unterbrechen erhält die gesamte verbleibende Arbeit.
- **Wetter und Zustand:** Frost, zu nasser Boden, ungeeignetes Erntewetter und ein verschlissener Traktor verhindern die entsprechende Arbeit. Hinweise erscheinen am Feld.
- **Speichern:** Arbeitsfortschritt wird während der Arbeit regelmäßig und bei Aktionen gespeichert. Nach Neuladen wird eine laufende Arbeit fortgesetzt; eine unterbrochene bleibt unterbrochen. Alte geplante Aufträge werden als unterbrochene Arbeiten übernommen, ohne Betriebsmittel erneut zu berechnen.
- **Aktive Hofansicht:** Die Ausführung läuft in der sichtbaren Hofansicht. Andere Menüs, ein ausgeblendeter Tab oder ein geschlossenes Spiel halten sie an; bei Rückkehr wird fortgesetzt. Es gibt keinen Offline-Fortschritt.

Freie Fahrt ist weiterhin eine vereinfachte Hofbewegung ohne Diesel- oder Zeitverbrauch. Arbeitsstunden und Kosten stammen aus der vorhandenen Spielbalance; sie sind keine realistischen Leistungsdaten des Farmall D-320. Kartenflächen sind schematisch und nicht maßstabsgetreu zu ihren Hektarangaben.

## Update mit Termux

Lade **ackerzeit-v0.3.0.zip** in den Android-Downloadordner und führe dein vorhandenes Update-Skript aus:

```bash
bash ~/update.sh ~/storage/downloads/ackerzeit-v0.3.0.zip BronkoKulitschka/ackerzeit
```

Danach den bisherigen Ackerzeit-Spiellink vollständig neu laden. GitHub Pages benötigt gegebenenfalls etwas Zeit für die Veröffentlichung. Das Paket muss nicht von Hand entpackt werden. Das Skript prüft es, übernimmt die Dateien und erstellt und pusht einen normalen Commit. Kein Force-Push. `update.sh` ist gegenüber dem vorliegenden 0.1.1-Repository unverändert.

Der Spielstand bleibt im Browser unter derselben Adresse erhalten. Unter **Spielhilfe → Spielstand exportieren** lässt er sich zusätzlich als JSON sichern. Falls das Skript fehlt, liegt es im ZIP unter `farm-manager/update.sh`.

Paketprüfung ohne Anmeldung oder Upload:

```bash
bash ~/update.sh --check ~/storage/downloads/ackerzeit-v0.3.0.zip
```

## Weitere Bedienung

| Aktion | Bedienung |
|---|---|
| Kamera verschieben | Maus oder einen Finger ziehen |
| Zoomen | Mausrad, zwei Finger oder + / − |
| Traktor / Hof ansehen | Traktor beziehungsweise Hof in der Kartenleiste |
| Feld auswählen | Direkt antippen oder die Feldschaltfläche unter der Karte |
| Frei fahren | Fahren → freie Stelle antippen |
| Anhalten | Stopp; bei fokussierter Karte auch Leertaste oder Escape |
| Pausieren | Pause / Weiter; dauerhaft auch Unterbrechen / Fortsetzen am Feld |
| Wachstum und Wetter | Nächster Tag / Bis zu 7 Tage |
| Spielstand übertragen | JSON-Export und -Import unter Spielhilfe |

Der Farmall umfährt die drei Hofgebäude mit Sicherheitsabstand. Ziele in Gebäuden und außerhalb der Karte werden abgewiesen. Die Fahrzeuglenkung und Wendemanöver sind vereinfachte Darstellungen, keine vollständige Fahrzeugphysik.

Die Smartphone-Seite passt in den Bildschirm. Lange Verwaltungsansichten und Felddetails haben einen eigenen Scrollbereich. Auf kleinen Bildschirmen öffnet sich die Feldauswahl als untere Karte; nach dem Arbeitsstart wird sie geschlossen, damit die Feldarbeit sichtbar bleibt.

## Vorhandene Hofverwaltung

Drei eigene Felder mit insgesamt 9 ha und ein kaufbares Feld mit 2 ha; Sommergerste und Winterweizen mit Aussaatfenstern und Überwinterung; Wetter, Jahreszeiten, Feuchtigkeit und Ertragseinflüsse; Maschinenwartung; Betriebsmittel und Getreidelager; saisonale Verkaufspreise, Lagerausbau, Kredite und Buchungen.

Ein erster Ablauf: Im März Boden bearbeiten, Sommergerste säen, düngen. Mit Tageswechseln bis zur Reife wachsen lassen. Im Sommer den Lohnunternehmer zur Ernte bestellen und das Getreide verkaufen. Anschließend Boden bearbeiten und im September/Oktober Winterweizen bestellen. Düngung ist im aktuellen Spiel eine optionale Ertragsverbesserung.

## Lokal starten und entwickeln

Alle Three.js-Abhängigkeiten und GLB-Modelle liegen im Paket. Zum Spielen sind kein npm-Build und kein CDN nötig. Ein HTTP-Server ist für die Module erforderlich:

```bash
cd ~/ackerzeit-repos/BronkoKulitschka/ackerzeit
python -m http.server 8000 --bind 127.0.0.1
```

Im Browser `http://127.0.0.1:8000` öffnen. Server mit Strg+C beenden. `file://` reicht nicht aus. Benötigt WebGL 2 sowie ES-Module und Import Maps. Bei einem 3D-Fehler bleiben die Verwaltungsmenüs nutzbar; sichtbare Feldarbeit benötigt eine funktionierende 3D-Ansicht. Keine installierbare Offline-PWA.

| Datei | Aufgabe |
|---|---|
| `engine.js` | Wirtschaft, Anbau, Reservierungen und gespeicherter Arbeitsfortschritt |
| `app.js`, `index.html`, `style.css` | Feldaktionen und Verwaltungsoberfläche |
| `farm3d.js` | Szene, Fahrzeuge, Geräte, sichtbare Bearbeitung und Bedienung |
| `world.js` | Kartenlayout, Wegfindung, Geräteprofile und Arbeitsbahnen |
| `model-loader.js`, `data/models.json` | Gemeinsamer GLB-Modellkatalog |
| `assets/models/`, `vendor/three/` | Lokale Modelle und Three.js 0.180.0 samt MIT-Lizenz |
| `tools/build-release.py` | ZIP mit vollständigem SHA-256-Manifest |
| `update.sh` | Vorhandener Termux-Update-Workflow |
| `tests/`, `TESTBERICHT.md` | Automatisierte Prüfungen und Prüfumfang |

```bash
node --test tests/*.test.cjs
python3 tools/build-release.py
```

Weitere Modelle lassen sich über den bestehenden Katalog vorbereiten; siehe `MODELLKATALOG.md`. Geräte und Mähdrescher sind momentan einfache Code-Geometrien. Noch offen sind manuelles Ankuppeln, Abfahrer und Transportketten, Befüllung am Hof, mehrere gleichzeitig arbeitende Maschinen, Personalverwaltung, zusätzliche Bodenpflege wie Kalken und Pflanzenschutz, Tiere und frei platzierbare Gebäude. Diese Funktionen werden nicht als vorhandene FS25-Entsprechungen dargestellt.
