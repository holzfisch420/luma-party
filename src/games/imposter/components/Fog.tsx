/** Langsam wabernder violetter Nebel als Hintergrund */
export function Fog() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="fog-layer fog-a" />
      <div className="fog-layer fog-b" />
      <div className="fog-layer fog-c" />
      <div className="fog-vignette" />
    </div>
  );
}
