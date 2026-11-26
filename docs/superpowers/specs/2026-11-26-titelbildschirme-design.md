# Titelbildschirme pro Spiel (Konsolen-Menü)

## Warum
Das heutige Startfenster (`LaunchPanel`) zeigt nach der Spielauswahl Beschreibung, Spieler-Infos,
Kategorien, Einstellungen und Start auf einmal – auf dem Fernseher und auf dem Handy. Das wirkt
überladen. Gewünscht ist ein Menü wie bei einem Konsolenspiel: Nach dem Öffnen eines Spiels kommt
ein Titelbildschirm, der sich wie ein Teil des Spiels anfühlt, mit wenigen, passenden Knöpfen.

## Ziele
- Jedes der 14 Spiele hat einen eigenen Titelbildschirm im eigenen Look (Aufbau, Hintergrund,
  Schrift, Knopf-Stil, Effekte, Geräusche). Je mehr Abwechslung zwischen den Spielen, desto besser.
- Pro Spiel nur die Knöpfe, die dort Sinn ergeben. Einstellungen und Regeln sind eigene Unterseiten.
- Steuerung: Das Handy der Person mit „Wahl“ (Spielleitung) ist die Fernbedienung – es zeigt dieselben
  Knöpfe, ein Tipp löst die Aktion aus. Alle anderen Handys zeigen „Schau zum Fernseher“.
  Am Fernseher geht es zusätzlich mit Pfeiltasten/Enter/Esc (Tastatur, Fernbedienung).
- Fernseher und Handy zeigen immer dieselbe Seite (Titel, Einstellungen, Regeln …).

## Nicht-Ziele
- Keine Änderung an den Spielen selbst oder an ihren Einstellungs-Inhalten (die bestehenden
  `SettingsPanel`/`QuickSettings` werden in die Unterseiten eingebettet).
- Kein Umbau des Home-Rasters (Kachelmenü) – nur was nach dem Öffnen einer Kachel passiert.

## Anti-Ziele
- 14 gleich aussehende Menüs mit anderer Farbe.
- Ein Menü, das wieder alles auf einer Seite zeigt.
- Handy und Fernseher, die auseinanderlaufen (verschiedene Seiten zeigen).

## Ansätze
1. **Gemeinsames Menü-Gerüst + eigener Titelbildschirm pro Spiel (gewählt).** Steuerung, Abgleich
   und Unterseiten einmal; jedes Spiel liefert seinen Titelbildschirm (Aufbau frei) und seine Knöpfe.
2. Eine Vorlage, pro Spiel nur Farben/Texte – zu wenig Abwechslung.
3. Jedes Menü komplett eigenständig inkl. Steuerung – 14× dieselbe Logik, uneinheitliche Fernbedienung.

## Aufbau
**Server:** Raumzustand bekommt `menu: { gameId, view } | null`. Neue Ereignisse (nur Fernseher
oder Spielleitung, wie bei `room:selectGame`): `room:openMenu {gameId}`, `room:menuView {view}`,
`room:closeMenu`. Beim Spielstart, Spielwechsel und Ende wird `menu` geleert.
Start bleibt `room:startGame`; Knöpfe wie „Einzeln“ (Klingenrad) oder „Filme“ (Couch-Match) setzen
vorher per `room:updateSettings` die passende Einstellung.

**Client – Gerüst** (`src/components/game-menu/`):
- Menü-Beschreibung pro Spiel im Client-Modul (`menu`): Knöpfe
  `{ id, label, icon, hint?, action: start (+ Einstellungs-Änderung) | Unterseite | zurück }`,
  Unterseiten `{ id, titel, Inhalt }` (Inhalt = vorhandenes SettingsPanel, QuickSettings,
  Wortverwaltung, Regeln …).
- `TitleScreen` pro Spiel (Fernseher): bekommt Knöpfe, Fokus und Aktionen; gestaltet alles selbst.
- Gemeinsame Unterseiten-Ansicht im Stil des Spiels (Rahmen/Farben aus dem Spiel).
- Tastatur am Fernseher: Pfeile = Fokus, Enter = auslösen, Esc/Rücktaste = zurück.
- Handy der Spielleitung: Fernbedienung mit denselben Knöpfen in den Farben des Spiels; in
  Unterseiten die Einstellungen direkt zum Antippen.
- Andere Handys: „Schau zum Fernseher“ mit Spielname und Look; die Minispiele bleiben erreichbar.
- Startbedingungen (zu wenig Spieler usw.) als kurzer Hinweis auf dem Titelbildschirm, Start-Knopf
  dann gesperrt.

## Knöpfe und Look pro Spiel
| Spiel | Look & Effekte | Knöpfe |
|---|---|---|
| Montagsmaler | Karopapier, Titel wird live „gezeichnet“, Knöpfe als Klebezettel, Bleistift unterstreicht den Fokus | Spielen · Wörter (Kategorien/Schwierigkeit) · Eigene Wörter · Einstellungen · Regeln |
| Vollmond | Nachtdorf, aufgehender Mond, Nebel, flackernde Fenster, Wolfsgeheul | Spielen · Rollen (Werwölfe & Sonderrollen) · Regeln |
| Imposter | Dunkel, Glitch-Titel, Schattengestalt mit leuchtenden Augen, Knöpfe als Geheimakten | Spielen · Kategorien · Einstellungen · Regeln |
| Echt jetzt? | Korkpinnwand, Knöpfe als angepinnte Zettel, „ECHT!“-Stempel | Spielen · Aussagen-Sets · Einstellungen · Regeln |
| Plopp! | Unterwasser, aufsteigende Blasen, Kugelfisch bläht sich beim Fokus auf, Knöpfe als Luftblasen | Spielen · Kategorien · Einstellungen · Regeln |
| Wortknacker | Buchstabenkacheln, Titel klappt grün/gelb auf, Knöpfe als Kachelreihen | Spielen · Einstellungen · Regeln |
| Klingenrad | Zirkuszelt, Scheinwerfer, drehendes Rad, Glühbirnen-Schilder | Einzeln · Ein Rad (starten direkt im Modus) · Einstellungen · Regeln |
| Kurvenrausch | Rennstrecke, Startampel, Zielflagge | Rennen starten · Strecken · Einstellungen · Regeln |
| Hühnerjagd | Landstraße, laufendes Huhn, Knöpfe als Straßenschilder | Spielen · Karten · Einstellungen · Regeln |
| Kettenchaos | Arena von oben, Radar, Schablonenschrift | Spielen · Einstellungen (Karten, Power-ups, Ziel) · Regeln |
| Textprobe | Bühne, Vorhang öffnet sich, Spotlight folgt dem Fokus | Probe beginnen · Skript · Regeln |
| Couch-Match | Kinosaal, Leuchtreklame, Plakate | Filme · Serien · Beides (starten direkt) · Genres · Regeln |
| Schach | Brett in Perspektive, Figuren ziehen im Hintergrund | Partie starten · Bedenkzeit & Farben · Regeln |
| Mühle | Holzbrett, Steine fallen beim Fokus | Spielen · Einstellungen · Regeln |

Jeder Titelbildschirm hat zusätzlich „Zurück“ (zum Home-Menü), Esc wirkt genauso.

## Dem Bauenden überlassen
- Genaue Animationen, Schriften, Anordnung je Spiel (innerhalb der Tabelle oben).
- Wie die Unterseiten im jeweiligen Stil eingerahmt werden.
- Ob Fokus-Wechsel am Fernseher auf dem Handy angezeigt wird (nicht nötig – Handy tippt direkt).

## Meine Entscheidungen (zum Prüfen)
- Fokus am Fernseher bleibt lokal; nur die geöffnete Seite wird abgeglichen.
- Hat der Host die Auswahl übernommen, steuern nur Fernseher/Tastatur; alle Handys zeigen „Schau zum Fernseher“.
- Die Minispiele bleiben für wartende Handys unter „Schau zum Fernseher“ erreichbar.
