import { Music, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAudioSettings, onAudioSettings, setAudioSettings, type AudioSettings } from '../../app/audio/engine';
import { ui } from '../../app/audio/sfx';
import { SettingRow, Toggle } from './Controls';

export function useAudioSettings(): AudioSettings {
  const [s, setS] = useState(getAudioSettings());
  useEffect(() => onAudioSettings(setS), []);
  return s;
}

function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round(value * 100)}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      onPointerUp={() => ui.tap()}
      className="knubbel-range h-2 w-44 cursor-pointer appearance-none rounded-full bg-[#dfe4e9] accent-cyan"
    />
  );
}

/** Musik- und Effekt-Lautstärke (gilt für dieses Gerät) */
export function AudioSettingsRows() {
  const s = useAudioSettings();
  return (
    <>
      <SettingRow label={<span className="flex items-center gap-2">{s.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />} Ton</span>} hint="Musik und Geräusche auf diesem Bildschirm">
        <Toggle checked={!s.muted} onChange={(on) => setAudioSettings({ muted: !on })} label="Ton an" />
      </SettingRow>
      <SettingRow label={<span className="flex items-center gap-2"><Music className="size-4" /> Musik</span>}>
        <Slider value={s.music} onChange={(music) => setAudioSettings({ music })} label="Musik-Lautstärke" />
      </SettingRow>
      <SettingRow label="Geräusche">
        <Slider value={s.sfx} onChange={(sfx) => setAudioSettings({ sfx })} label="Geräusch-Lautstärke" />
      </SettingRow>
    </>
  );
}
