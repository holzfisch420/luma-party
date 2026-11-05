/**
 * Platzhalter für zukünftige Spiele. Sie erscheinen im Launcher als „Bald verfügbar“.
 * Sobald ein Spiel implementiert ist, wird es als eigenes Modul (wie `montagsmaler/`)
 * angelegt und hier entfernt.
 */
import type { GameMeta } from '../../shared/types/game';

export const FUTURE_GAMES: GameMeta[] = [
  {
    id: 'quiz',
    name: 'Blitzquiz',
    tagline: 'Wer weiß es am schnellsten?',
    description: 'Wissensfragen mit vier Antworten – je schneller du tippst, desto mehr Punkte.',
    minPlayers: 2,
    maxPlayers: 12,
    durationMinutes: [10, 20],
    status: 'coming-soon',
    theme: { from: '#3b82f6', via: '#6366f1', to: '#0ea5e9', accent: '#60a5fa' },
    tags: ['Wissen', 'Schnell'],
  },
  {
    id: 'schaetzen',
    name: 'Schätzmeister',
    tagline: 'Näher dran gewinnt.',
    description: 'Wie hoch ist der Eiffelturm? Schätze so genau wie möglich und schlage die anderen.',
    minPlayers: 2,
    maxPlayers: 12,
    durationMinutes: [10, 15],
    status: 'coming-soon',
    theme: { from: '#10b981', via: '#14b8a6', to: '#0ea5e9', accent: '#34d399' },
    tags: ['Schätzen', 'Zahlen'],
  },
  {
    id: 'bluff',
    name: 'Bluffmaschine',
    tagline: 'Lüg überzeugend.',
    description: 'Erfinde falsche Antworten auf echte Fragen und finde die Wahrheit unter den Lügen.',
    minPlayers: 3,
    maxPlayers: 10,
    durationMinutes: [15, 25],
    status: 'coming-soon',
    theme: { from: '#a855f7', via: '#d946ef', to: '#6366f1', accent: '#c084fc' },
    tags: ['Bluff', 'Kreativ'],
  },
  {
    id: 'wer-bin-ich',
    name: 'Wer bin ich?',
    tagline: 'Frag dich durch.',
    description: 'Alle kennen deine geheime Identität – nur du nicht. Stelle Ja/Nein-Fragen.',
    minPlayers: 3,
    maxPlayers: 10,
    durationMinutes: [10, 20],
    status: 'coming-soon',
    theme: { from: '#f59e0b', via: '#f97316', to: '#ef4444', accent: '#fbbf24' },
    tags: ['Raten', 'Kommunikation'],
  },
];
