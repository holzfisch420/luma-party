/** Eigenes Logo: drei verspielte Kreise. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'size-7', md: 'size-9', lg: 'size-14' }[size];
  const text = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size];
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className={`${dims} shrink-0 drop-shadow-sm`} aria-hidden>
        <circle cx="14" cy="15" r="10" fill="#1fb3d4" />
        <circle cx="27" cy="15" r="8" fill="#ffb02e" />
        <circle cx="20" cy="27" r="9" fill="#ff5d73" />
        <circle cx="20" cy="20" r="3.5" fill="#fff" />
      </svg>
      <span className={`${text} font-black tracking-tight text-home-text`}>
        luma<span className="text-cyan">party</span>
      </span>
    </div>
  );
}
