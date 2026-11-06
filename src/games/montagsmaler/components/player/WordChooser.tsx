import { motion } from 'framer-motion';
import { Burst } from '../../../../components/comic/Burst';

export function WordChooser({ choices, onChoose }: { choices: string[]; onChoose: (index: number) => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5 pb-6">
      <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="mx-auto">
        <Burst className="aspect-[1.5] w-72" spikes={16}>
          <div className="font-bangers text-4xl leading-none">Du bist dran!</div>
          <div className="text-base font-bold">Wähle ein Wort</div>
        </Burst>
      </motion.div>
      <div className="flex flex-col gap-4">
        {choices.map((w, i) => (
          <motion.button
            key={w}
            initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0, rotate: i % 2 ? 1 : -1 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
            whileTap={{ x: 3, y: 3, boxShadow: '0 0 0 #161616' }}
            onClick={() => onChoose(i)}
            className="comic-box font-bangers truncate px-6 py-4 text-4xl"
          >
            {w}
          </motion.button>
        ))}
      </div>
      <p className="text-center text-sm font-bold">Läuft die Zeit ab, wird ein Wort zufällig gewählt.</p>
    </div>
  );
}
