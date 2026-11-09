import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Check, Crown, Dices, Eye, Image, Shapes, Smile, Sparkles, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
  AVATAR_PARTS,
  AVATAR_SLIDERS,
  BG_COLORS,
  BODY_COLORS,
  EYE_COLORS,
  SLIDER_MAX,
  randomAvatar,
  type AvatarConfig,
  type AvatarPart,
  type AvatarSlider,
} from '../../shared/avatar';
import { Button } from '../ui/Button';
import { AvatarFace, avatarBackground } from './AvatarFace';

type ColorKey = 'color' | 'bg' | 'eyeColor';

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  part?: AvatarPart;
  color?: { key: ColorKey; colors: readonly string[]; label: string };
  sliders?: AvatarSlider[];
  extra?: 'cheeks';
}

const SECTIONS: Section[] = [
  { id: 'shape', label: 'Form', icon: Shapes, part: 'shape', color: { key: 'color', colors: BODY_COLORS, label: 'Farbe' } },
  { id: 'eyes', label: 'Augen', icon: Eye, part: 'eyes', color: { key: 'eyeColor', colors: EYE_COLORS, label: 'Augenfarbe' }, sliders: ['eyeSize', 'eyeGap', 'eyeY'] },
  { id: 'brows', label: 'Brauen', icon: Sparkles, part: 'brows' },
  { id: 'mouth', label: 'Mund', icon: Smile, part: 'mouth', sliders: ['mouthSize', 'mouthY'], extra: 'cheeks' },
  { id: 'extra', label: 'Extras', icon: Crown, part: 'extra' },
  { id: 'bg', label: 'Hintergrund', icon: Image, color: { key: 'bg', colors: BG_COLORS, label: 'Hintergrundfarbe' } },
];

interface Props {
  initial: AvatarConfig;
  onSave: (avatar: AvatarConfig) => Promise<void> | void;
  onCancel?: () => void;
  saveLabel?: string;
}

/** Knubbel-Baukasten: große 3D-Vorschau, Kategorien mit Mini-Vorschauen, Farben und Regler. */
export function AvatarEditor({ initial, onSave, onCancel, saveLabel = 'Speichern' }: Props) {
  const [avatar, setAvatar] = useState<AvatarConfig>(initial);
  const [sectionId, setSectionId] = useState(SECTIONS[0]!.id);
  const [saving, setSaving] = useState(false);
  const [spin, setSpin] = useState(0);
  const section = SECTIONS.find((s) => s.id === sectionId)!;
  const set = (patch: Partial<AvatarConfig>) => setAvatar((a) => ({ ...a, ...patch }));

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
        <Preview avatar={avatar} spin={spin} />
        <Button
          variant="secondary"
          className="!size-14 !p-0"
          aria-label="Zufälliger Knubbel"
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
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl" style={{ background: avatarBackground(avatar) }}>
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

          {section.sliders && (
            <div className="flex flex-col gap-3 rounded-2xl border border-home-line bg-white px-4 py-3">
              {section.sliders.map((key) => (
                <Slider key={key} label={AVATAR_SLIDERS[key]} value={avatar[key]} onChange={(v) => set({ [key]: v } as Partial<AvatarConfig>)} />
              ))}
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
                      style={{ background: `radial-gradient(circle at 35% 30%, #ffffffaa, transparent 45%), ${c}` }}
                    >
                      {active && <Check className="size-5 drop-shadow" color={isLight(c) ? '#333' : '#fff'} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {section.extra === 'cheeks' && (
            <label className="flex items-center justify-between rounded-2xl border border-home-line bg-white px-4 py-3">
              <span className="font-extrabold">Rosige Bäckchen</span>
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

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 190;
}

/** große Vorschau: schwebt leicht und kippt räumlich mit dem Finger/der Maus */
function Preview({ avatar, spin }: { avatar: AvatarConfig; spin: number }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-16, 16]), { stiffness: 180, damping: 18 });
  const rotX = useSpring(useTransform(my, [-1, 1], [12, -12]), { stiffness: 180, damping: 18 });
  return (
    <div
      className="[perspective:700px]"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        key={spin}
        initial={{ scale: 0.85, rotate: spin ? -10 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        style={{ rotateX: rotX, rotateY: rotY, background: avatarBackground(avatar) }}
        className="home-tile relative size-48 overflow-hidden rounded-[28%] shadow-[inset_0_-10px_24px_rgba(0,0,0,0.08)] sm:size-56"
      >
        <motion.div className="absolute inset-0" animate={{ y: [0, -5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
          <AvatarFace avatar={avatar} className="absolute inset-0 size-full" />
        </motion.div>
        {/* Glanz auf der Kachel */}
        <div className="pointer-events-none absolute inset-0 rounded-[28%] bg-[linear-gradient(150deg,rgba(255,255,255,0.55),transparent_38%)]" />
      </motion.div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const pct = (value / SLIDER_MAX) * 100;
  return (
    <label className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm font-extrabold">{label}</span>
      <input
        type="range"
        min={0}
        max={SLIDER_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="knubbel-range h-2 flex-1 cursor-pointer appearance-none rounded-full"
        style={{ background: `linear-gradient(90deg, #1fb3d4 ${pct}%, #d5dbe1 ${pct}%)` }}
        aria-label={label}
      />
      <button type="button" onClick={() => onChange(SLIDER_MAX / 2)} className="w-12 shrink-0 text-right text-xs font-black text-home-muted hover:text-cyan-dark" title="Zurücksetzen">
        {value - SLIDER_MAX / 2 > 0 ? '+' : ''}
        {value - SLIDER_MAX / 2}
      </button>
    </label>
  );
}
