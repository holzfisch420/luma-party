import { getClientGame } from '../../games/game-registry';

/** Regeln eines Spiels als nummerierte Liste */
export function RulesView({ gameId, tone = 'light' }: { gameId: string; tone?: 'light' | 'dark' }) {
  const module = getClientGame(gameId);
  const rules = module?.rules ?? [];
  const dark = tone === 'dark';
  return (
    <div className="flex flex-col gap-3">
      <p className={`text-base font-semibold ${dark ? 'text-white/75' : 'text-home-muted'}`}>{module?.meta.description}</p>
      <ol className="flex flex-col gap-2.5">
        {rules.map((r, i) => (
          <li key={i} className={`flex gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold leading-snug ${dark ? 'bg-white/10 text-white' : 'bg-black/[0.04] text-home-text'}`}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full text-sm font-black text-white" style={{ background: module?.meta.theme.accent }}>
              {i + 1}
            </span>
            {r}
          </li>
        ))}
      </ol>
    </div>
  );
}
