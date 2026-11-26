# Titelbildschirme pro Spiel – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nach dem Öffnen eines Spiels zeigt der Fernseher einen eigenen Titelbildschirm im Spiel-Look; das Handy der Spielleitung ist die Fernbedienung, alle anderen sehen „Schau zum Fernseher“.

**Architecture:** Der Raum bekommt einen abgeglichenen Menü-Zustand `menu: { gameId, view } | null`. Ein gemeinsames Gerüst (`src/components/game-menu/`) übernimmt Knöpfe, Fokus, Tastatur, Unterseiten, Start und Handy-Ansichten; jedes Spiel liefert `menu` (Knöpfe/Unterseiten) und eine eigene `TitleScreen`-Komponente.

**Tech Stack:** React 19, TypeScript, Tailwind v4, framer-motion, Socket.IO, zod, vitest, Playwright (Sichtprüfung).

**Spec:** `docs/superpowers/specs/2026-11-26-titelbildschirme-design.md`

## Global Constraints
- Steuern dürfen nur Fernseher und Spielleitung (`room.canControl`), wie bei `room:selectGame`.
- `menu` wird geleert bei Spielstart, Spielende (zurück zum Launcher) und wenn das Spiel gewechselt wird.
- Bestehende `SettingsPanel`/`QuickSettings` werden unverändert in Unterseiten eingebettet.
- Jedes Spiel: eigener Look; Knöpfe laut Tabelle im Spec; immer „Zurück“; Esc/Rücktaste = zurück.
- Texte auf Deutsch; keine fremden Marken/Figuren.

## Review Focus
1. Spielleitung verlässt den Raum, während das Menü offen ist → Menü bleibt offen, neue Spielleitung bekommt die Fernbedienung.
2. Zu wenig Spieler → „Spielen“-Knöpfe gesperrt mit Hinweis, Fernbedienung zeigt denselben Hinweis.
3. Unterseite offen und Spiel wird am Handy gestartet → Menü schließt sich überall.
4. Host hat die Auswahl übernommen → alle Handys „Schau zum Fernseher“, Handy-Ereignisse werden abgelehnt.
5. Unbekannte Unterseite / falsches Spiel in `room:menuView` → wird ignoriert.

---

### Task 1: Menü-Zustand auf dem Server
**Files:** Modify `src/shared/types/room.ts` (RoomSnapshot), `src/shared/events/index.ts`, `src/server/rooms/room.ts`, `src/server/sockets/register-handlers.ts`; Test `tests/server-flow.test.ts`
**Interfaces – Produces:** `RoomSnapshot.menu: { gameId: string; view: string } | null`; Events `room:openMenu {gameId}`, `room:menuView {view}`, `room:closeMenu`; `Room.openMenu(gameId)`, `Room.setMenuView(view)`, `Room.closeMenu()`.
- [ ] Test „Spielmenü wird abgeglichen“: Spielleitung öffnet `plopp` → `host.room.menu = {gameId:'plopp', view:'title'}`; Nicht-Spielleitung kann nicht ändern; `menuView('settings')` → view `settings`; ungültige view (>32 Zeichen / leer) ignoriert; `room:startGame` → `menu` null; Host übernimmt Auswahl → Handy-Ereignisse ignoriert.
- [ ] Implementieren (openMenu setzt auch `selectedGameId`; view-Format `/^[a-z0-9-]{1,32}$/`).
- [ ] Tests grün, committen.

### Task 2: Gerüst am Fernseher
**Files:** Create `src/components/game-menu/{types.ts,useGameMenu.ts,HostGameMenu.tsx,MenuSubview.tsx,RulesView.tsx,DefaultTitleScreen.tsx,primitives.tsx}`; Modify `src/games/game-types.ts`, `src/app/launcher/HomeScreen.tsx` (LaunchPanel ersetzen)
**Interfaces – Produces:**
- `MenuAction = { kind:'start'; patch?: Record<string, unknown> } | { kind:'view'; view: string } | { kind:'back' }`
- `MenuItem { id; label; icon?: LucideIcon; hint?; action: MenuAction; primary?: boolean }`
- `MenuView { id; title; Content: ComponentType<MenuViewProps> }`; `MenuViewProps { room; gameId; settings; onChange; disabled; device:'host'|'phone' }`
- `ClientGameModule.menu?: { items: MenuItem[]; views?: MenuView[] }`, `ClientGameModule.TitleScreen?: ComponentType<TitleScreenProps>`
- `TitleScreenProps { meta; room; items: MenuItem[]; focus: number; setFocus(i:number):void; activate(i:number):void; blocked: string | null; starting: boolean }`
- `resolveMenu(module): { items; views }` – Standard: Spielen, Einstellungen (falls SettingsPanel), Regeln, Zurück; „settings“ und „rules“ sind eingebaute Unterseiten.
- `useMenuActions(room, gameId)` → `{ run(action), starting, blocked }` (start = optional `room:updateSettings` mit patch, dann `room:startGame`).
- [ ] Test (vitest, rein logisch): `resolveMenu` liefert Standardknöpfe + hängt „Zurück“ an; eigene Unterseiten werden mit eingebauten vereint.
- [ ] HostGameMenu: Vollbild, zeigt `TitleScreen` (oder Default) bei view `title`, sonst `MenuSubview` im Spiel-Look; Tastatur (Pfeile/Enter/Esc).
- [ ] HomeScreen: Kachel-Aktivierung → `room:openMenu`; LaunchPanel entfernen.
- [ ] Prüfen im Browser, committen.

### Task 3: Handy – Fernbedienung und „Schau zum Fernseher“
**Files:** Create `src/components/game-menu/{PhoneRemote.tsx,LookAtTv.tsx}`; Modify `src/components/mobile-controller/MobileLobby.tsx`
**Interfaces – Consumes:** Task 2 (`resolveMenu`, `useMenuActions`, `MenuView`).
- [ ] Spielleitung: Kachel antippen → `room:openMenu`; bei offenem Menü Fernbedienung (Knöpfe im Spiel-Look, Unterseite = gleicher Inhalt editierbar, „Zurück“).
- [ ] Andere: „Schau zum Fernseher“ mit Spielname/Farben, darunter Minispiele.
- [ ] Prüfen im Browser, committen.

### Task 4–8: Titelbildschirme (je Spiel `components/TitleScreen.tsx` + `menu` in `index.ts`)
Knöpfe und Look exakt laut Tabelle im Spec. Gemeinsame Bausteine aus `primitives.tsx` (`useFocusSound`, `PlayerHint`), sonst frei.
- Task 4: Montagsmaler, Echt jetzt?, Wortknacker
- Task 5: Vollmond, Imposter, Textprobe
- Task 6: Plopp!, Klingenrad, Couch-Match (Klingenrad/Couch-Match: Start-Knöpfe mit `patch`)
- Task 7: Kurvenrausch, Hühnerjagd, Kettenchaos
- Task 8: Schach, Mühle
Pro Task: Typecheck, Sichtprüfung per Playwright-Screenshot jedes Titelbildschirms, committen.

### Task 9: Abschluss
- [ ] Ende-zu-Ende: Kachel öffnen → Einstellungen am Handy ändern → Fernseher zeigt Unterseite → Start → Spiel läuft; README-Abschnitt „So wird gespielt“ anpassen; alle Tests; pushen.
