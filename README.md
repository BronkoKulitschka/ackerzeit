# Ackerzeit · Farm Manager 0.1.1

Ein deutschsprachiger Browser-Prototyp: Pixelart-Hofkarte, Managementmenüs und ein spielbares Ackerbaujahr. Reines HTML, CSS und JavaScript. Keine Installation von npm-Paketen, kein Build, keine externen Schriftarten oder Bilddateien.

## Neu in Version 0.1.1

- Echte isometrische 2:1-Pixelansicht mit räumlichen Gebäuden, Feldrauten, Bäumen und sichtbarer Bodenkante.
- Fahrender Traktor mit Anbaugerät oder Mähdrescher als Vorschau des ersten ausführbaren Feldauftrags. Bei blockierten Aufträgen bleibt die Maschine am Hof.
- Bewegter Schornsteinrauch, Windrad, Vögel und wetterabhängiger Regen oder Schnee.
- Animation pausieren/starten; Betriebssystem-Einstellung für reduzierte Bewegung wird berücksichtigt.
- Höchstens 20 Animationsbilder pro Sekunde. Keine Animationsschleife bei unsichtbarem Tab, außerhalb des sichtbaren Kartenbereichs oder nach Verlassen der Hofansicht.
- Antippen trifft die isometrischen Feldflächen. Die Feldschaltflächen bleiben als Alternative verfügbar.

Die Animation ist eine **Arbeitsvorschau**. Fortschritt, Arbeitsverbrauch und Wachstum laufen weiterhin über den Tageswechsel. Bestehende Spielstände aus 0.1.0 sind kompatibel; das Format und der Spielkern bleiben gleich. Das bisherige `update.sh` kann das neue ZIP übernehmen.

## Enthalten

- Drei eigene Felder mit insgesamt 9 ha und ein kaufbares Feld mit 2 ha.
- Sommergerste und Winterweizen, Aussaatfenster, Überwinterung und Ernte.
- Tägliches Wetter, vier Jahreszeiten, Bodenfeuchte, Wachstum und Ertragseinflüsse.
- Bodenbearbeitung, Aussaat, Düngung und Ernte per Lohnunternehmer.
- Gemeinsame Arbeitskapazität von 8 Stunden pro Tag; Warteschlange mit Stornierung.
- Diesel, Saatgut, Dünger, Traktorverschleiß und Wartung.
- Getreidelager, saisonale Verkaufspreise, Lagerausbau, Kredite und Buchungen.
- Automatisches lokales Speichern sowie JSON-Export und -Import.
- Responsive Darstellung für Smartphone, Tablet und Desktop.

## Schnellstart in Termux

1. Erstelle auf GitHub ein **eigenes, leeres Repository**, beispielsweise `farm-manager`. Wähle für kostenloses GitHub Pages ein öffentliches Repository. Eine README im ansonsten leeren Repository ist ebenfalls möglich.
2. Lade `ackerzeit-v0.1.1.zip` und die separat bereitgestellte `update.sh` in den Android-Ordner **Download**.
3. Führe einmalig in Termux aus:

```bash
pkg update
pkg install git python gh
termux-setup-storage
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
cp ~/storage/downloads/update.sh ~/update.sh
```

Erlaube Termux den Speicherzugriff. Folge beim GitHub-Login dem angezeigten Gerätecode. Zugangsdaten gehören weder in dieses Projekt noch in einen Chat.

4. Erster Upload – `DEIN-NAME/farm-manager` durch dein echtes Repository ersetzen:

```bash
bash ~/update.sh ~/storage/downloads/ackerzeit-v0.1.1.zip DEIN-NAME/farm-manager
```

Das Skript prüft das ZIP, klont das Repository nach `~/ackerzeit-repos/DEIN-NAME/farm-manager`, übernimmt die Projektdateien, erstellt einen Commit und pusht auf den Standardbranch. Falls Git noch keine Autorenangaben hat, verwendet es lokal im Projekt deinen GitHub-Namen und deine GitHub-No-Reply-Adresse. Das zuletzt erfolgreich verwendete Repository wird gespeichert.

5. Auf GitHub einmalig öffnen: **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Den vom Skript ausgegebenen Branch (meist `main`) und **/(root)** wählen und speichern. Nach erfolgreicher Veröffentlichung zeigt GitHub dort den Spiellink an.

Beim üblichen Repositorynamen lautet er `https://DEIN-NAME.github.io/farm-manager/`. Verwende im Zweifel immer den Link aus den Pages-Einstellungen. Die Einrichtung ist durch die [GitHub-Pages-Dokumentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) beschrieben. Der [GitHub-CLI-Login](https://cli.github.com/manual/gh_auth_login) verwendet die offizielle Geräteanmeldung; [auth setup-git](https://cli.github.com/manual/gh_auth_setup-git) verbindet Git mit dieser Anmeldung.

## Spätere Updates

Lade die aktuelle ZIP herunter und aktualisiere dein Repository:

```bash
bash ~/update.sh ~/storage/downloads/ackerzeit-v0.1.1.zip BronkoKulitschka/ackerzeit
```

Entpacken von Hand ist nicht notwendig. Der Spielstand liegt im Browser und wird durch Git-Updates nicht gelöscht. Die aktuelle Version kann Spielstände des Formats 1 lesen.

Das Skript im Repository wird mit jedem Paket aktualisiert. Wenn eine neue Skriptversion mitgeliefert wurde, kopiere sie für spätere Aufrufe aus `~/ackerzeit-repos/DEIN-NAME/farm-manager/update.sh` nach `~/update.sh` oder lade die separat gelieferte Version herunter.

### Verhalten bei Problemen

- **Lokale Änderungen:** Das Skript stoppt vor der Übernahme. Bearbeite oder sichere deine Änderungen im angegebenen Checkout. Es gibt keinen automatischen Reset oder Stash.
- **Git-Konflikte:** Nur Fast-Forward wird zugelassen. Das Skript überschreibt keine auseinander gelaufene Historie.
- **Push unterbrochen:** Der Commit bleibt lokal erhalten. Führe denselben Aufruf erneut aus.
- **Anderes Projekt im Ziel:** Die Erstinstallation verweigert fremde Projektordner. Verwende ein separates Repository.
- **Defektes ZIP:** Dateiliste und SHA-256-Prüfsummen werden vor Git-Aktionen geprüft. Diese Prüfsummen erkennen Beschädigungen; sie sind keine digitale Signatur.
- **Veraltete Dateien:** Nur Dateien aus dem früheren Ackerzeit-Manifest werden bei Bedarf entfernt. Andere Dateien bleiben erhalten.
- **Speichern im Browser blockiert:** Das Spiel zeigt eine Meldung. Nutze dann Spielhilfe → Spielstand exportieren. Eine defekte vorhandene Speicherung wird beim Laden nicht still überschrieben.

ZIP-Prüfung ohne Git-Anmeldung oder Upload:

```bash
bash ~/update.sh --check ~/storage/downloads/ackerzeit-v0.1.1.zip
```

## Ohne Veröffentlichung lokal spielen

Auf einem Desktop die ZIP entpacken und `farm-manager/index.html` im Browser öffnen. Zuverlässiger ist ein lokaler Webserver. In Termux nach dem Upload:

```bash
cd ~/ackerzeit-repos/DEIN-NAME/farm-manager
python -m http.server 8000 --bind 127.0.0.1
```

Im Browser `http://127.0.0.1:8000` öffnen. Termux dabei weiterlaufen lassen. Mit Strg+C beenden. Spielstände auf localhost und GitHub Pages sind getrennt; sie können per JSON-Export übertragen werden.

## So spielst du das erste Jahr

1. Im März die Felder nacheinander bearbeiten, mit Sommergerste bestellen und düngen.
2. Aufträge mit „Nächster Tag“ abarbeiten. Bei Nässe oder Frost warten.
3. Zeit bis zur Erntereife verstreichen lassen. „Bis zu 7 Tage“ hält bei fertigen Aufträgen, neuen erntereifen Feldern und Monatswechsel an.
4. Im Juli bis September den Lohnunternehmer ernten lassen und das Getreide unter Lager & Markt verkaufen.
5. Die Stoppeln bearbeiten und im September/Oktober Winterweizen säen. Er bleibt über Winter stehen und reift im nächsten Sommer.
6. Rechtzeitig Diesel, Saatgut und Dünger auffüllen. Den Traktor bei Bedarf warten.

Die realen Kalenderdaten laufen über Schaltjahre hinweg. Das angezeigte Wetter wird beim Weitergehen für den aktuellen Tag verarbeitet; anschließend beginnt der nächste Tag. Es gibt kein Wachstum in echter Offline-Zeit.

## Grenzen von Version 0.1

Dies ist die erste spielbare Grundlage, keine fertige Landwirtschaftssimulation. Wetter, Erträge, Kosten und Wachstumswerte sind vereinfachte Spielmodelle. Jahreszeiten, Aussaatfenster und Abhängigkeiten bilden grundlegende Arbeitsabläufe ab, ersetzen aber keine fachliche Anbauplanung. Es werden keine aktuellen Marktpreise abgerufen.

Tierhaltung, frei platzierbare Gebäude, mehrere Traktoren, Personal, detaillierte Bodenarten und Nährstoffbilanzen, Unkraut, Pflanzenschutz, Steuern und Förderungen sind noch nicht enthalten. Hofkosten und Kreditmodell sind bewusst einfach. Wartung ist sofortig. Teilweise stornierte Feldarbeit muss erneut begonnen werden. Diesel und Material werden beim Planen reserviert; der ungenutzte Anteil kommt bei Stornierung zurück.

## Projektstruktur

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Einstieg und Grundgerüst |
| `style.css` | Responsive Oberfläche |
| `engine.js` | Spielregeln und Spielstandprüfung, unabhängig von der Oberfläche |
| `app.js` | Menüs, Bedienung, Speichern und Kartenanbindung |
| `isometric.js` | Isometrische Pixelgrafik, Feldauswahl und Animationssteuerung |
| `update.sh` | ZIP prüfen und per Git auf GitHub aktualisieren |
| `release-manifest.json` | Paketversion und SHA-256-Dateiprüfsummen |
| `tests/engine.test.cjs` | Reproduzierbare Prüfung der Simulation |

Optionaler Entwicklertest mit Node.js:

```bash
node --test tests/*.test.cjs
```

Die Pixelgrafik entsteht aus eigenen Canvas-Sprites. Keine Bildlizenz oder Online-Verbindung wird zum Laden des Spiels benötigt. Die Weiterentwicklung erfolgt in kleinen, vollständig spielbaren Schritten.
