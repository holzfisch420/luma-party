/** Knöpfe und Seiten eines Spielmenüs – aus der Angabe des Spiels plus Standardteilen. */
import { ArrowLeft, BookOpen, Play, SlidersHorizontal } from 'lucide-react';
import type { ClientGameModule, MenuItem, MenuView } from '../../games/game-types';

const BACK: MenuItem = { id: 'back', label: 'Zurück', icon: ArrowLeft, action: { kind: 'back' } };
const BUILTIN: Record<string, MenuView> = {
  settings: { id: 'settings', title: 'Einstellungen' },
  rules: { id: 'rules', title: 'Regeln' },
};

export interface ResolvedMenu {
  items: MenuItem[];
  views: MenuView[];
  view: (id: string) => MenuView | undefined;
}

export function resolveMenu(module: ClientGameModule): ResolvedMenu {
  const items: MenuItem[] = module.menu?.items ?? [
    { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
    ...(module.SettingsPanel ? [{ id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } } as MenuItem] : []),
    { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
  ];
  const all = [...items.filter((i) => i.action.kind !== 'back'), BACK];
  // nur Seiten, die ein Knopf auch öffnet
  const wanted = new Set(all.flatMap((i) => (i.action.kind === 'view' ? [i.action.view] : [])));
  const custom = new Map((module.menu?.views ?? []).map((v) => [v.id, v]));
  const views = [...wanted].map((id) => custom.get(id) ?? BUILTIN[id]).filter((v): v is MenuView => !!v);
  return { items: all, views, view: (id) => views.find((v) => v.id === id) };
}
