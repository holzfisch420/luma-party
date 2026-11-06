import { AnimatePresence, motion } from 'framer-motion';
import { Check, Dices, Glasses, Palette, Scissors, Smile, Sparkles, UserRound, Eye, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
  AVATAR_PARTS,
  EYE_COLORS,
  HAIR_COLORS,
  SHIRT_COLORS,
  SKIN_TONES,
  randomAvatar,
  type AvatarConfig,
  type AvatarPart,
} from '../../shared/avatar';
import { Button } from '../ui/Button';
import { AvatarFace, shade } from './AvatarFace';

type ColorKey = 'skin' | 'hairColor' | 'eyeColor' | 'shirt';

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  part?: AvatarPart;
  color?: { key: ColorKey; colors: readonly string[]; label: string };
  extra?: 'cheeks';
}

const SECTIONS: Section[] = [
  { id: 'face', label: 'Gesicht', icon: UserRound, part: 'face', color: { key: 'skin', colors: SKIN_TONES, label: 'Hautton' }, extra: 'cheeks' },
  { id: 'hair', label: 'Frisur', icon: Scissors, part: 'hair', color: { key: 'hairColor', colors: HAIR_COLORS, label: 'Haarfarbe' } },
  { id: 'eyes', label: 'Augen', icon: Eye, part: 'eyes', color: { key: 'eyeColor', colors: EYE_COLORS, label: 'Augenfarbe' } },
  { id: 'brows', label: 'Brauen', icon: Sparkles, part: 'brows' },
  { id: 'nose', label: 'Nase', icon: UserRound, part: 'nose' },
  { id: 'mouth', label: 'Mund', icon: Smile, part: 'mouth' },
  { id: 'beard', label: 'Bart', icon: UserRound, part: 'facialHair', color: { key: 'hairColor', colors: HAIR_COLORS, label: 'Bartfarbe' } },
  { id: 'glasses', label: 'Brille', icon: Glasses, part: 'glasses' },
  { id: 'color', label: 'Lieblingsfarbe', icon: Palette, color: { key: 'shirt', colors: SHIRT_COLORS, label: 'Lieblingsfarbe' } },
];

interface Props {
  initial: AvatarConfig;
  onSave: (avatar: AvatarConfig) => Promise<void> | void;
  onCancel?: () => void;
  saveLabel?: string;
}

/** Avatar-Baukasten: Vorschau, Kategorien, Mini-Vorschauen je Option, Farben, Würfeln. */
export function AvatarEditor({ initial, onSave, onCancel, saveLabel = 'Speichern' }: Props) {
  const [avatar, setAvatar] = useState<AvatarConfig>(initial);
  const [sectionId, setSectionId] = useState(SECTIONS[0]!.id);
  const [saving, setSaving] = useState(false);
  const [spin, setSpin] = useState(0);
  const section = SECTIONS.find((s) => s.id === sectionId)!;
  const set = (patch: Partial<AvatarConfig>) => setAvatar((a) => ({ ...a, ...patch }));
  const bg = shade(SHIRT_COLORS[avatar.shirt]!, 0.72);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(avatar);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Vorschau */}
      <div className="flex items-end justify-center gap-4">
        <motion.div
          key={spin}
          initial={{ scale: 0.9, rotate: spin ? -6 : 0 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="home-tile relative size-48 overflow-hidden rounded-[28%] sm:size-56"
          style={{ background: `radial-gradient(circle at 50% 35%, #fff, ${bg})` }}
        >
          <AvatarFace avatar={avatar} className="absolute inset-0 size-full" />
        </motion.div>
        <Button
          variant="secondary"
          className="!size-14 !p-0"
          aria-label="Zufälliger Avatar"
          title="Würfeln"
          onClick={() => {
            setAvatar(randomAvatar());
            setSpin((s) => s + 1);
          }}
        >
          <Dices className="size-6" />
        </Button>
      </div>

      {/* Kategorien */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSectionId(s.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-extrabold transition ${
              s.id === sectionId ? 'border-cyan bg-cyan text-white shadow' : 'border-home-line bg-white text-home-muted'
            }`}
          >
            <s.icon className="size-4" />
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="flex flex-col gap-4">
          {section.part && (
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
              {AVATAR_PARTS[section.part].map((label, i) => {
                const preview = { ...avatar, [section.part!]: i } as AvatarConfig;
                const active = avatar[section.part!] === i;
                return (
                  <button
                    key={label}
                    onClick={() => set({ [section.part!]: i } as Partial<AvatarConfig>)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition ${active ? 'border-cyan bg-cyan/10 shadow' : 'border-home-line bg-white'}`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl" style={{ background: shade(SHIRT_COLORS[avatar.shirt]!, 0.82) }}>
                      <AvatarFace avatar={preview} crop="bust" className="absolute inset-0 size-full" />
                      {active && (
                        <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-cyan text-white">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[11px] font-bold text-home-muted">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {section.color && (
            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">{section.color.label}</div>
              <div className="flex flex-wrap gap-2.5">
                {section.color.colors.map((c, i) => {
                  const active = avatar[section.color!.key] === i;
                  return (
                    <button
                      key={c}
                      onClick={() => set({ [section.color!.key]: i } as Partial<AvatarConfig>)}
                      aria-label={`${section.color!.label} ${i + 1}`}
                      aria-pressed={active}
                      className={`grid size-11 place-items-center rounded-full border-2 border-white shadow-md transition ${active ? 'scale-110 ring-[3px] ring-cyan' : ''}`}
                      style={{ background: c }}
                    >
                      {active && <Check className="size-5 drop-shadow" color={i >= 6 && section.color!.key === 'hairColor' ? '#333' : '#fff'} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {section.extra === 'cheeks' && (
            <label className="flex items-center justify-between rounded-2xl border border-home-line bg-white px-4 py-3">
              <span className="font-extrabold">Rote Bäckchen</span>
              <input type="checkbox" checked={avatar.cheeks} onChange={(e) => set({ cheeks: e.target.checked })} className="size-5 accent-[#1fb3d4]" />
            </label>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button variant="primary" size="lg" className="flex-1" icon={<Check className="size-5" />} loading={saving} onClick={() => void save()}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
