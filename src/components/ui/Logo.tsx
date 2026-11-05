export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'size-7', md: 'size-9', lg: 'size-14' }[size];
  const text = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size];
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${dims} shrink-0`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-rose-500 to-violet-500 blur-md opacity-60" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-rose-500 to-violet-500" />
        <div className="absolute inset-[30%] rounded-full bg-ink-950" />
      </div>
      <span className={`${text} font-semibold tracking-tight`}>
        Luma <span className="font-light text-white/60">Party</span>
      </span>
    </div>
  );
}
