import { Brain, Drama, HelpCircle, Ruler, Sparkles, type LucideIcon } from 'lucide-react';

/** Icons für die generischen Cover der noch nicht implementierten Spiele. */
export const FUTURE_GAME_ICONS: Record<string, LucideIcon> = {
  quiz: Brain,
  schaetzen: Ruler,
  bluff: Drama,
  'wer-bin-ich': HelpCircle,
};

export const DEFAULT_COVER_ICON = Sparkles;
