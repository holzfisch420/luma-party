import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Smartphone, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';

const isPhone = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse) and (max-width: 820px)').matches;

export function Landing() {
  const options = [
    {
      to: '/host',
      icon: Tv,
      title: 'Hauptbildschirm',
      text: 'Auf dem Fernseher, Beamer oder Laptop öffnen. Hier läuft das Spiel für alle sichtbar.',
      gradient: 'from-violet-500/40 via-fuchsia-500/20 to-transparent',
      primary: !isPhone,
    },
    {
      to: '/play',
      icon: Smartphone,
      title: 'Mitspielen',
      text: 'Auf dem Smartphone öffnen, Raumcode eingeben – dein Handy wird zum Controller.',
      gradient: 'from-orange-500/40 via-rose-500/20 to-transparent',
      primary: isPhone,
    },
  ].sort((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <div className="app-backdrop flex min-h-dvh flex-col px-6 safe-pt safe-pb sm:px-12">
      <header className="py-6">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
            Partyspiele für
            <br />
            <span className="bg-gradient-to-r from-orange-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">euer Wohnzimmer.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/60">Ein großer Bildschirm, alle Smartphones als Controller. Keine App, keine Anmeldung.</p>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-2">
          {options.map((o, i) => (
            <motion.div key={o.to} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
              <Link
                to={o.to}
                className="group glass relative flex h-full flex-col gap-6 overflow-hidden rounded-[32px] p-8 transition duration-500 hover:scale-[1.015] hover:bg-white/10 focus-visible:scale-[1.015]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${o.gradient} opacity-70 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="relative grid size-16 place-items-center rounded-3xl bg-white/15">
                  <o.icon className="size-8" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
                    {o.title}
                    <ArrowRight className="size-6 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-white/65">{o.text}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <Link to="/words" className="flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white">
          <BookOpen className="size-4" /> Eigene Wortlisten verwalten
        </Link>
      </main>
    </div>
  );
}
