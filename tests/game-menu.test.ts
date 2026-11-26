import { describe, expect, it } from 'vitest';
import { resolveMenu } from '../src/components/game-menu/menu-model';
import type { ClientGameModule } from '../src/games/game-types';
import { getClientGame } from '../src/games/game-registry';

const base = { meta: { id: 'x', name: 'X' }, HostView: () => null, PlayerView: () => null } as unknown as ClientGameModule;

describe('Spielmenü – Knöpfe und Seiten', () => {
  it('Standard: Spielen, Einstellungen (falls vorhanden), Regeln, Zurück', () => {
    const withSettings = resolveMenu({ ...base, SettingsPanel: () => null });
    expect(withSettings.items.map((i) => i.id)).toEqual(['play', 'settings', 'rules', 'back']);
    expect(withSettings.items[0]!.action).toEqual({ kind: 'start' });
    expect(withSettings.views.map((v) => v.id).sort()).toEqual(['rules', 'settings']);
    expect(resolveMenu(base).items.map((i) => i.id)).toEqual(['play', 'rules', 'back']);
  });

  it('eigene Knöpfe und Seiten; „Zurück“ wird immer angehängt', () => {
    const m = resolveMenu({
      ...base,
      menu: {
        items: [
          { id: 'solo', label: 'Einzeln', action: { kind: 'start', patch: { mode: 'solo' } } },
          { id: 'words', label: 'Wörter', action: { kind: 'view', view: 'words' } },
          { id: 'rules', label: 'Regeln', action: { kind: 'view', view: 'rules' } },
        ],
        views: [{ id: 'words', title: 'Wörter', Content: () => null }],
      },
    });
    expect(m.items.map((i) => i.id)).toEqual(['solo', 'words', 'rules', 'back']);
    expect(m.views.map((v) => v.id).sort()).toEqual(['rules', 'words']);
    expect(m.view('words')?.title).toBe('Wörter');
    expect(m.view('gibtsnicht')).toBeUndefined();
  });

  it('jedes Spiel hat Titelbildschirm, Start-Knopf und nur erreichbare Seiten', () => {
    for (const id of ['montagsmaler', 'vollmond', 'imposter', 'echt', 'plopp', 'wort', 'klingen', 'racer', 'huhn', 'panzer', 'theater', 'kino', 'schach', 'muehle']) {
      const mod = getClientGame(id)!;
      expect(mod.TitleScreen, id).toBeTruthy();
      const m = resolveMenu(mod);
      expect(m.items.some((i) => i.action.kind === 'start'), id).toBe(true);
      for (const i of m.items) if (i.action.kind === 'view') expect(m.view(i.action.view), `${id}: ${i.action.view}`).toBeTruthy();
    }
  });
});
