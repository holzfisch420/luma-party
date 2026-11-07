import { CategoryPicker } from '../../../components/words/CategoryPicker';
import type { SettingsPanelProps } from '../../game-types';
import type { MontagsmalerSettings } from '../game-config';

/** Kategorien und Schwierigkeit – direkt im Startbildschirm und in den Einstellungen */
export function MontagsmalerQuickSettings(props: SettingsPanelProps<MontagsmalerSettings>) {
  return <CategoryPicker {...props} />;
}
