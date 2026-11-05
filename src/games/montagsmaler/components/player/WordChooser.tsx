import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';

export function WordChooser({ choices, onChoose }: { choices: string[]; onChoose: (index: number) => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 via-rose-500 to-violet-500">
          <Pencil className="size-8" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Du bist dran!</h2>
        <p className="mt-1 text-white/55">Wähle ein Wort, das du zeichnen möchtest.</p>
      </div>
      <div className="flex flex-col gap-3">
        {choices.map((w, i) => (
          <motion.button
            key={w}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChoose(i)}
            className="glass rounded-3xl px-6 py-5 text-2xl font-semibold tracking-tight transition hover:bg-white/15"
          >
            {w}
          </motion.button>
        ))}
      </div>
      <p className="text-center text-xs text-white/40">Wenn die Zeit abläuft, wird ein Wort zufällig gewählt.</p>
    </div>
  );
}
