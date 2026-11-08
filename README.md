# Luma Party

Ein Multi-Game-Party-Launcher im Apple-TV-Stil. Ein Fernseher, Beamer oder Laptop ist der **Hauptbildschirm**,
alle Mitspielenden nutzen ihr **Smartphone als Controller** – ohne App und ohne Anmeldung.

Erstes vollständig spielbares Spiel: **Montagsmaler** (Zeichnen & Raten) mit rund 1100 integrierten Wörtern in 14 Kategorien.

---

## Am einfachsten: als Programm (ohne Installation)

1. `LumaParty-Windows.zip` entpacken (Mac: `LumaParty-Mac-….zip`).
2. Doppelklick auf **LumaParty-Windows.exe** – der Spielbildschirm öffnet sich automatisch als App-Fenster.
3. Smartphones im **gleichen WLAN** scannen den QR-Code auf dem Bildschirm. Fertig.

Beim ersten Start unter Windows: SmartScreen → „Weitere Informationen“ → „Trotzdem ausführen“;
Firewall-Abfrage mit **„Zulassen“** bestätigen (sonst erreichen die Handys den PC nicht).
Zum Beenden das schwarze Konsolenfenster schließen. Details: `docs/ANLEITUNG.txt`.

Programme selbst bauen (Windows, macOS Intel/Apple Silicon, Linux – von jedem Betriebssystem aus):

```bash
npm install
npm run desktop          # alle Plattformen → release/
npm run desktop:windows  # nur Windows
```

Das Programm bettet Frontend und Laufzeitumgebung (Bun) ein; Wortlisten liegen unter
`%APPDATA%\LumaParty` (Windows), `~/Library/Application Support/LumaParty` (Mac) bzw. `~/.local/share/luma-party`.

### Müssen alle im gleichen WLAN sein?

Ja – PC und Smartphones müssen im selben Netzwerk sein, ein spezielles WLAN ist aber nicht nötig (normales Heim-WLAN).
Ohne WLAN: ein Handy als Hotspot einschalten und PC + alle anderen Handys damit verbinden.
Gäste-WLANs mit „Client-Isolation“ blockieren die Verbindung zwischen Geräten – dann ebenfalls den Hotspot nutzen.

## Online spielen (ohne gemeinsames WLAN)

Online braucht ihr kein gemeinsames WLAN: Jeder öffnet die Internetadresse, auch mit mobilen Daten oder von woanders.
Das Projekt ist für **Render** vorbereitet (kostenloser Tarif, Server in Frankfurt, `render.yaml`):

1. Code in ein GitHub-Repository legen.
2. Auf <https://render.com> mit GitHub anmelden → **New** → **Blueprint** → Repository wählen → **Apply**.
3. Nach ca. 3–5 Minuten ist die App unter `https://luma-party-xxxx.onrender.com` erreichbar.
   TV/PC öffnet `…/host`, Handys scannen den QR-Code.

Jeder Push auf GitHub aktualisiert die Online-Version automatisch.

**Online-Modus** (`LUMA_PUBLIC=1`, in `render.yaml` gesetzt):
- Eigene Wortlisten sind **pro Gerät privat** (zufällige Gerätekennung im Browser) – Fremde sehen sie nicht.
- Jedes Gerät sichert seine Listen zusätzlich im Browser. Kostenlose Server löschen bei jedem Neustart ihre Dateien;
  beim nächsten Öffnen werden die Listen automatisch wiederhergestellt.
- Missbrauchsschutz: Rate-Limits für API, neue Räume pro IP und Fehlversuche beim Raumcode; Obergrenze aktiver Räume.

**Hinweise zum kostenlosen Tarif:** Nach 15 Minuten ohne Besucher schläft der Server ein. Der erste Aufruf danach
dauert bis zu einer Minute. Laufende Spiele sind davon nicht betroffen (aktive Verbindungen halten ihn wach).

Andere Anbieter (Railway, Fly.io, eigener Server): Das `Dockerfile` baut einen fertigen Container
(Port über `PORT`, Online-Modus bereits aktiv).

## Entwicklung

Voraussetzung: Node.js ≥ 20.

```bash
npm install
npm run dev
```

- Hauptbildschirm: <http://localhost:5173/host>
- Smartphones (im selben WLAN): QR-Code auf dem Hauptbildschirm scannen oder `http://<LAN-IP>:5173/play` öffnen und den Raumcode eingeben.

Im Entwicklungsmodus laufen zwei Prozesse: Vite (Frontend, Port 5173) und der Spielserver (Port 3001). Vite leitet
`/api` und `/socket.io` an den Server weiter.

### Produktion (ein Port)

```bash
npm run build
npm start          # Port 3000, mit PORT=… änderbar
```

Der Server liefert dann das gebaute Frontend aus und gibt die LAN-Adressen für die Smartphones in der Konsole aus.

### Weitere Befehle

| Befehl | Zweck |
| --- | --- |
| `npm test` | Unit- und Multiplayer-Integrationstests (Vitest, echte Socket.IO-Clients) |
| `npm run typecheck` | Strikte TypeScript-Prüfung für Client und Server |
| `npm run desktop` | Desktop-Programme für Windows/Mac/Linux bauen (`release/`) |

---

## So wird gespielt

1. `/host` auf dem TV öffnen – ein Raum mit 4-stelligem Code (z. B. `KNBH`) wird erstellt.
2. Mitspielende öffnen `/play` auf dem Smartphone (oder scannen den QR-Code), geben Code und Namen ein.
3. Spiel wählen:
   - **am TV** mit Maus, Tastatur oder Fernbedienung (`←` `→` wählen, `Enter` starten, `E` Einstellungen), oder
   - **per Smartphone**: Die zuerst beigetretene Person sieht die Spielauswahl auf dem Handy (Badge „Wahl“).
     Der Host kann die Auswahl jederzeit übernehmen (Menü → „Spielauswahl am Bildschirm“).
4. **Montagsmaler**: Wer dran ist, wählt ein Wort und zeichnet auf dem Handy. Die Zeichnung erscheint live auf dem TV,
   die anderen raten über ihr Handy. Vermutungen erscheinen als Chat-Bubbles links oder rechts unten.
5. Nach der letzten Runde: Rangliste mit Siegertreppchen, „Nochmal spielen“ oder „Zurück zum Launcher“.

Eigene Wörter: TV-Menü → „Eigene Wörter“, auf dem Handy in der Lobby oder unter `/words`. Im Spiel unter
Einstellungen → Wörter → **Eigene Wörter** (nur eigene) oder **Mix** wählen und die Listen aktivieren.

---

## Spiele

### Montagsmaler
Zeichnen & Raten im Comic-Stil (siehe oben).

- **Kategorien & Schwierigkeit** lassen sich direkt im Startbildschirm des Spiels auswählen (TV oder Handy),
  z. B. nur „Tiere“ + „Redewendungen“. Standard ist „Mittel“ + „Schwer“; „Leicht“ lässt sich zuschalten.
- Kategorien: Tiere, Essen, Gegenstände, Berufe, Natur, Fahrzeuge, Aktivitäten, Orte, Redewendungen,
  Begriffe (abstrakt, z. B. „Fernweh“, „Datenschutz“), Deutschrap, Englischer Rap, Geeker-Vocab
  (standardmässig aus, im Startbildschirm zuschaltbar) und Sonstiges.

### Imposter
Bluff-Spiel für **3–12 Spieler** im mysteriösen Look (dunkel, violetter Nebel).

- Alle bekommen dasselbe geheime Wort aufs Handy – nur der **Imposter** nicht. Die Karte wird nur angezeigt,
  solange man sie **gedrückt hält** (damit niemand mitliest).
- **Hinweisrunden:** Reihum sagt jede Person laut ein passendes Wort und tippt „Fertig“. Der Imposter beginnt nie.
- **Diskussion** (Zeit einstellbar), dann **Abstimmung** auf dem Handy. Wird der Imposter enttarnt, darf er noch
  das Wort raten.
- **Punkte:** Imposter entkommt +3 · erwischt, aber Wort erraten +2 · Crew bei Enttarnung +1, wer richtig gestimmt hat +1 extra.
- Wörter und **Kategorien wie beim Montagsmaler** – direkt im Startbildschirm auswählbar.
- Einstellungen: Runden, Hinweisrunden (1–3), Diskussionszeit, Kategorie für alle sichtbar.

### Hühnerjagd
Schwerkraft-Flucht für **1–8 Spieler**, nach dem Vorbild des Hühner-Minispiels aus „1 2 3 4 Player Games“ –
eigene Grafik, eigene Level.

- **Alle Hühner laufen im selben Level**, die Kamera scrollt immer schneller nach rechts.
- **Steuerung:** ein Knopf auf dem Handy – **Schwerkraft umdrehen**: vom Boden an die Decke und zurück
  (nur mit festem Stand, mit kurzem Eingabe-Puffer).
- **Plattformen auf verschiedenen Höhen** am Boden und an der Decke, mit Lücken und Stufen; ab „Dorfstraße“
  auch schwebende Blöcke in der Mitte.
- **Raus ist**, wer in eine Lücke fällt (abgestürzt), einem **Polizisten** in die Arme läuft (stehen oben und unten)
  oder hinten vom **Polizei-Helikopter** eingeholt wird (zu weit zurückgefallen, z. B. an einer Wand hängen geblieben).
- **Kollisionen zwischen den Hühnern:** sie schubsen sich, stehen aufeinander, und bei einer „Kopfnuss“ in der Luft
  prallen beide zurück.
- **6 Level** mit Schwierigkeit 1–5 (Bauernhof ★ … Nachtrazzia ★★★★★): Tempo, Lückenhäufigkeit, Höhenunterschiede,
  Polizisten und schwebende Blöcke steigen. Der Generator garantiert, dass es immer einen Weg gibt (per Test geprüft,
  inkl. Bot, der jedes Level schafft). Level kommen per Seed – Server und Fernseher erzeugen dasselbe Level.
- **Punkte:** je früher ausgeschiedenem Huhn 1 Punkt, Rundensieg +1. Solo: Punkte nach Strecke.
- **Sound:** Wusch beim Umdrehen, Boing beim Rempeln, Pfeifton beim Absturz, Gackern + Trillerpfeife beim Schnappen,
  Martinshorn wenn die Polizei nah ist, Countdown, Fanfare und Fluchtmelodie (Web Audio, keine Dateien).

### Kettenchaos (Panzer-Arena)
Eigenes Panzer-Partyspiel in Draufsicht für **2–8 Spieler**, inspiriert von klassischen Panzer-Minispielen –
mit eigenen Grafiken, eigenem Namen und eigenen Arenen.

- **Steuerung:** drei Knöpfe. **Fahrknopf** gedrückt = sofort vorwärts, losgelassen = auf der Stelle drehen,
  kurz tippen = Drehrichtung wechseln. **Feuer** schießt, **Item** setzt das eingesammelte Power-up ein.
  Funktioniert hochkant und quer.
- **Regeln:** Kugeln prallen nicht ab – sie verschwinden an der Wand. Max. 3 eigene Kugeln gleichzeitig.
  Der letzte Panzer gewinnt die Runde; wer zuerst die eingestellte Zahl an Runden gewinnt, ist Champion.
- **16 Panzerfarben** zur Auswahl (jede Farbe nur einmal pro Partie).
- **13 Arenen** (Offenes Feld, Kreuzung, Labyrinth, Säulenhalle, Festung, X-Kreuz, Schachbrett, Spirale,
  Zwei Lager, Gassen, Ring, Inseln, Engpass) in vier Themen (Sand, Gras, Schnee, Asphalt).
- **Reifenspuren**, die langsam verblassen, und Brandflecken nach Explosionen.
- **8 Power-ups** aus Kisten: Laser (Strahl quer durchs Feld), Schrot (7 Kugeln), Lenkrakete, Mine, Schild,
  Dauerfeuer, Splitterbombe, Tarnkappe.
- Einstellungen: Siege zum Gewinnen, Power-up-Häufigkeit, Arenen-Auswahl, Zufall oder der Reihe nach.
- **Look:** flacher Stil im Geiste der Google-Minispiele (Schachbrett-Boden, flache Blöcke, keine Konturen),
  Kugeln mit Leuchtspur in der Farbe des Schützen, Einschlag-Funken, Mündungsblitze, Partikel-Explosionen.
- Technik: Server-Simulation mit 60 Hz, Positionsdaten mit 20 Hz an den Fernseher (dort auf 60 fps interpoliert),
  Handys senden nur den Knopfzustand.

### Textprobe (Theater-Text lernen)
Karaoke-artiges Lernprogramm für Theaterskripte – Rolle und Text erscheinen groß auf dem Fernseher,
gesteuert wird Zeile für Zeile per Handy.

- **Skript hochladen:** In den Einstellungen eine Word-Datei (`.docx`) wählen. Der Browser erkennt
  „Szene 1: Titel“, „Figuren: …“, Regieanweisungen in Klammern und Zeilen wie „Name: Text“
  (eingebettete Anweisungen werden kleiner und kursiv dargestellt). Seitenzahlen entsprechen den
  Seiten im Word-Dokument. Tippfehler in Rollennamen („Aplh“ → „Alph“) werden anhand der
  Figurenlisten zusammengeführt; kurze Namen (Zip/Zap/Zop) bleiben getrennt. Vorschau vor dem Speichern.
- **Privat:** Skripte liegen nur auf dem eigenen Server (online pro Gerät bzw. Konto), nicht im Code.
- **Handy:** Szene und Seite wählen, große Tasten **Nach oben** / **Nach unten**, eine Taste zum
  Ausblenden (alles sichtbar → Zeile davor → Zeile danach → beide), dazu Optionen:
  Regieanweisungen überspringen, eigene Rolle(n) hervorheben, Probe beenden.
- **Fernseher:** Bühne mit Vorhang, aktuelle Zeile im Scheinwerferlicht, zwei Zeilen davor und
  drei danach; ausgeblendete Zeilen zeigen nur die Rolle und Platzhalter.

## Handy als Controller: Haptik & Home-Bildschirm

- **Haptik** (`src/app/haptics.ts`, für alle Spiele nutzbar): Tasten und Spielereignisse
  (Power-up, Treffer, zerstört, Countdown) geben spürbare Rückmeldung. Im Gamepad-Menü abschaltbar.
  - **Android:** echte Vibrationsmuster über die Vibration API.
  - **iPhone (ab iOS 18):** Safari kennt keine Vibration API. Genutzt wird, dass Safari beim Umschalten
    eines `<input type="checkbox" switch>` einen kurzen haptischen Klick auslöst – zuverlässig bei
    Tastendrücken, stärkere Rückmeldungen als mehrere Klicks. Abgestufte Stärken gibt es auf dem iPhone
    nur in einer nativen App.
- **Als App installieren:** Web-App-Manifest + App-Symbole. Auf dem iPhone in Safari: *Teilen → Zum Home-Bildschirm*
  (der Beitrittsbildschirm zeigt dazu einen Tipp) – dann läuft der Controller im Vollbild ohne Safari-Leisten.

## Konten & Avatare

- **Konto (optional):** Benutzername + Passwort. Gäste können weiterhin ohne Konto mitspielen.
  Mit Konto kommen Name und Avatar automatisch mit – auf jedem Gerät.
- **Avatar-Editor** auf dem Handy (`/konto` oder in der Lobby über den eigenen Avatar):
  Gesichtsform, Hautton, Frisur & Haarfarbe, Augen & Augenfarbe, Brauen, Nase, Mund, Bart, Brille,
  Bäckchen und Lieblingsfarbe – mit Live-Vorschau, Mini-Vorschau je Option und „Würfeln“.
  Eigene SVG-Figur im Mii-ähnlichen Stil (keine fremden Grafiken), im Spiel automatisch mit Comic-Kontur.
- Ein Gast kann sich in der Lobby anmelden – sein Platz im Raum wird dann mit dem Konto verknüpft.
- Gleiches Konto auf einem zweiten Gerät übernimmt den bestehenden Platz im Raum.
- **Sicherheit:** Passwörter mit scrypt gehasht, signierte Anmelde-Tokens (HMAC), Passwortänderung
  meldet andere Geräte ab, Konto löschen jederzeit möglich, Rate-Limit für Anmeldeversuche.
- **Online:** Eigene Wortlisten gehören dem Konto (statt dem Gerät), sobald man angemeldet ist.

### Speicherung

| Umgebung | Speicher |
| --- | --- |
| Desktop-Programm / `npm run dev` | JSON-Dateien (`data/` bzw. `%APPDATA%\LumaParty`) |
| Online mit `DATABASE_URL` | PostgreSQL (Tabelle `luma_documents`, wird automatisch angelegt) |

Für Render (oder jeden anderen Anbieter) eine kostenlose PostgreSQL-Datenbank anlegen, z. B. bei
<https://neon.tech>, die Verbindungsadresse kopieren und bei Render unter **Environment** als
`DATABASE_URL` eintragen. Ohne Datenbank laufen Konten online nur bis zum nächsten Neustart.

## Design

- **Launcher (Home-Menü):** hell und freundlich – Kachelraster (5×3 pro Seite) mit glänzenden Rahmen,
  cyanfarbener Auswahl mit „Start“-Leiste, Sprechblase mit dem Spielnamen, Seitenpunkte oben,
  Raum-Kachel oben links und eine Icon-Leiste unten (Spieler, Beitreten, Wörter, Vollbild, Hilfe, Einstellungen).
  Bedienung mit Maus, Touch oder Pfeiltasten/Enter (TV-Fernbedienung). Das Handy der auswahlberechtigten
  Person zeigt dasselbe Raster. Inspiriert von Konsolen-Home-Menüs, aber mit eigenen Grafiken und Icons.
- **Spiele (Comic auf Karopapier):** Jedes Spiel bringt seinen eigenen Stil mit. Montagsmaler nutzt den
  Comic-Baukasten in `src/components/comic/` (Karopapier-Blatt mit Lochrand, Comic-Buttons, Sprechblasen,
  „BÄM!“-Sterne, Countdown, Punktetafel) – auf TV und Handy, inklusive eigener Rangliste (`ResultsView`).
- Schriften (Nunito, Bangers, Comic Neue) sind lokal eingebunden und funktionieren auch offline.

## Architektur

```
src/
├── app/                    # Bildschirme (Routing-Ziele)
│   ├── landing/            # Startseite: TV oder Smartphone
│   ├── launcher/           # Hauptbildschirm: HostApp, Top-Bar, Menü, Launcher
│   ├── game-screen/        # generische TV-Spielansicht (lädt das Spielmodul)
│   ├── mobile/             # Smartphone-App (Beitritt, Lobby, Spiel, Ergebnis)
│   ├── words/              # Seite zur Wortverwaltung
│   └── session/            # Socket, Session-Store, Host-/Spieler-Verbindung, Hooks
├── components/
│   ├── ui/                 # Button, Modal, Toast, Toggle, Countdown, Logo, Ladezustände, Verbindungsstatus
│   ├── launcher/           # HomeGrid, HomeTile, HomeDock, LaunchPanel, Kachel-Grafiken, Einstellungs-Sheet
│   ├── comic/              # Comic-Baukasten für Spiele (Papier, Buttons, Sprechblasen, Sterne …)
│   ├── lobby/              # Raumcode, Spielerliste, Avatar, QR-Beitritt
│   ├── mobile-controller/  # Join-Screen, Lobby, Spielauswahl auf dem Handy
│   ├── game/               # neutrale Rangliste (für Spiele ohne eigene ResultsView)
│   └── word-manager/       # Wortlisten-Verwaltung + API-Client
├── games/
│   ├── game-types.ts       # Client-Interface für Spiele
│   ├── game-registry.ts    # Client-Registry
│   ├── game-catalog.ts     # Metadaten aller Spiele (für Launcher & Server)
│   ├── montagsmaler/
│   │   ├── index.ts        # Client-Modul (Cover, TV-Ansicht, Handy-Ansicht, Einstellungen)
│   │   ├── game-config.ts  # Metadaten, Einstellungen (Zod), Punkte, Palette
│   │   ├── game-engine.ts  # Server-Engine (maßgebliche Spiellogik)
│   │   ├── types.ts        # Zustände, Aktionen, Events, Zeichenoperationen
│   │   ├── logic/          # Zeichenmodell, Wortvergleich, Punkte (Client + Server)
│   │   ├── words/          # 586 Standardwörter
│   │   ├── components/     # UI für TV und Smartphone
│   │   └── hooks/          # Live-Canvas, gebündeltes Senden
│   └── future-games/       # Platzhalter („Bald verfügbar“) + Cover-Icons
├── server/
│   ├── index.ts            # Express + Socket.IO (startServer)
│   ├── main.ts             # Startpunkt für npm run dev / npm start
│   ├── rooms/              # Room (Spieler, Rechte, Lebenszyklus), RoomManager (Codes, Aufräumen)
│   ├── sockets/            # Event-Handler mit Berechtigungsprüfung & Rate-Limit
│   ├── game-engine/        # Server-Interface für Spiele (GameEngine, GameContext, ServerGameModule)
│   ├── game-manager/       # GameSession (Zustandsversand, Timer, Cleanup), Server-Registry
│   ├── storage/            # Persistente Wortlisten (JSON-Datei)
│   └── routes/             # REST-API für Wortlisten
├── desktop/                # Desktop-Programm: startet Server, öffnet App-Fenster
└── shared/                 # Typen, Socket-Events, Konstanten, Hilfsfunktionen
```

### Datenfluss

- **Server ist die einzige Quelle der Wahrheit.** Clients senden nur Absichten (`game:action`), der Server validiert
  und verschickt Zustände.
- Pro Spiel gibt es einen **öffentlichen Zustand** (an alle) und einen **privaten Zustand** pro Spieler.
  Das geheime Wort existiert nur im privaten Zustand des Zeichners (und von Spielern, die es bereits erraten haben).
- Kurzlebige Ereignisse (Zeichenoperationen, Chat, Treffer) laufen über `game:event`.
- Zustandsänderungen werden pro Tick gebündelt; vor jedem Event wird ausstehender Zustand zuerst gesendet,
  damit die Reihenfolge stimmt.

### Zeichnen in Echtzeit

- Pointer Events (Touch, Maus, Stift) inkl. `getCoalescedEvents` für flüssige Linien.
- Übertragen werden **Zeichenoperationen**, keine Bilder: `Strich beginnen`, `Punkte anhängen`, `Undo`, `Leeren`.
  Koordinaten sind auf 0–1000 normalisiert (geräteunabhängig), Farben werden als Palettenindex gesendet.
- Punkte werden ~30× pro Sekunde gebündelt und zusammengefasst.
- Der Server prüft Absender (nur der aktuelle Zeichner), Phase, Wertebereiche und Obergrenzen, speichert den Stand
  und schickt ihn bei (Wieder-)Verbindung an TV oder Handy (`canvas-sync`).

### Sicherheit & Stabilität

- Antworten werden nur serverseitig geprüft (Groß-/Kleinschreibung, Umlaute `ä/ae`, `ß/ss`, Akzente egal).
  „Knapp daneben“ wird nur privat an die ratende Person gemeldet.
- Richtige Antworten werden nicht als Chat angezeigt; wer richtig geraten hat, kann nicht erneut punkten.
- Rate-Limits: Token-Bucket pro Socket für alle Spielaktionen, zusätzlich max. 5 Rateversuche pro 4 s.
- Eingaben (Namen, Wörter, Rateversuche) werden bereinigt und in der Länge begrenzt; Einstellungen per Zod validiert.
- Berechtigungen: Host-Aktionen nur mit Host-Token; Spielauswahl/Start nur Host oder berechtigter Spieler.
- **Wiederverbindung**: Host und Spieler erhalten ein geheimes Token (im `localStorage`). Nach Neuladen oder
  Netzabbruch wird die Sitzung automatisch fortgesetzt. Getrennte Spieler bleiben 3 Minuten reserviert;
  verliert der Zeichner die Verbindung, endet sein Zug nach 15 s. Kurz getrennte Rater zählen 10 s lang weiter mit.
- Wer mit einem bereits verwendeten Namen beitritt, während dieser Spieler getrennt ist, übernimmt dessen Platz.
- Spieler können jederzeit beitreten (auch während eines Spiels) und zeichnen ab der nächsten Runde mit.

---

## Ein neues Spiel hinzufügen

1. **Modul anlegen**: `src/games/<spiel>/`
2. **Metadaten & Einstellungen** in `game-config.ts` (React-frei): `GameMeta`, Default-Einstellungen, `parseSettings`.
3. **Server-Engine** in `game-engine.ts`: `GameEngine` implementieren (`start`, `getPublicState`, `getPrivateState`,
   `handleAction`, optionale Spieler-Hooks, `dispose`) und ein `ServerGameModule` exportieren.
   Kommunikation ausschließlich über den übergebenen `GameContext` (`publishState`, `emit`, `setTimer`, `endGame`).
4. **Registrieren**: Server in `src/server/game-manager/server-game-registry.ts`,
   Metadaten in `src/games/game-catalog.ts`.
5. **Oberflächen** in `index.ts` als `ClientGameModule`: `HostView` (TV), `PlayerView` (Handy),
   optional `SettingsPanel`, `ResultsView` und `Cover` (quadratische Kachel-Grafik); in `src/games/game-registry.ts` registrieren.
6. Fertig – der Launcher zeigt das Spiel automatisch an, inklusive Einstellungen, Start, Rangliste und Wiederverbindung.

Ergebnisse meldet die Engine mit `ctx.endGame({ scores })`; die Rangliste rendert der Launcher generisch.

---

## Technische Entscheidungen

| Entscheidung | Begründung |
| --- | --- |
| **Vite + React + TypeScript** statt Next.js | Die App ist eine reine Echtzeit-SPA; SSR bringt hier nichts. Vite ist schneller und einfacher. |
| **Ein Paket** mit `src/server` und `src/shared` | Gemeinsame Typen ohne Monorepo-Overhead; `tsx` führt den Server direkt aus. |
| **Kein PostgreSQL/Redis** in Version 1 | Spielzustände sind kurzlebig (im Speicher). Wortlisten werden als JSON-Datei (`data/word-lists.json`) atomar gespeichert. Der `WordListStore` ist klein genug, um später gegen Prisma/PostgreSQL getauscht zu werden. |
| **Wortlisten serverseitig** statt `localStorage` | Listen sollen von TV *und* Handys gepflegt werden und in jedem Raum verfügbar sein. Spieleinstellungen merkt sich der Hauptbildschirm zusätzlich im `localStorage`. |
| **Zod** für Einstellungen & REST | Strikte Validierung an der Vertrauensgrenze. |
| **Tailwind CSS v4, Framer Motion, Lucide** | Wie gewünscht; Cover sind eigene SVG/CSS-Grafiken (keine fremden Assets). |
| **Quadratische Zeichenfläche** | Passt gleichermaßen auf Hochkant-Handys und 16:9-TVs und lässt links/rechts Platz für Punkte und Chat-Bubbles. |

### Bekannte Grenzen

- Spielstände liegen im Arbeitsspeicher; ein Server-Neustart beendet laufende Räume.
- Für eine Verteilung über mehrere Server-Instanzen wäre ein Redis-Adapter für Socket.IO nötig.
- Es gibt keine Benutzerkonten: Im Heimnetz teilen sich alle Geräte die Wortlisten, online gehören sie dem jeweiligen Gerät (Browser-Daten löschen = Listen weg, sofern nicht auf dem Server vorhanden).
