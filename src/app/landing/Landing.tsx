import { motion } from 'framer-motion';
import { BookOpen, Smartphone, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';

const isPhone = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse) and (max-width: 820px)').matches;

export function Landing() {
  const options = [
    { to: '/host', icon: Tv, title: 'Fernseher', text: 'Hier läuft das Spiel für alle sichtbar.', color: '#1fb3d4', primary: !isPhone },
    { to: '/play', icon: Smartphone, title: 'Mitspielen', text: 'Dein Handy wird zum Controller.', color: '#ff8a1f', primary: isPhone },
  ].sort((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <div className="home-bg relative flex min-h-dvh flex-col overflow-hidden px-6 safe-pt safe-pb sm:px-12">
      <div className="home-shape left-[8%] top-[60%] h-40 w-72 rotate-[-14deg]" />
      <div className="home-shape right-[10%] top-[12%] h-56 w-56 rotate-12" />
      <header className="relative py-6">
        <Logo />
      </header>
      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-10 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-black tracking-tight text-balance sm:text-7xl">
            Spieleabend? <span className="text-cyan">Los geht's!</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg font-bold text-home-muted">Ein Bildschirm für alle, jedes Handy ist ein Controller. Keine App, keine Anmeldung.</p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2">
          {options.map((o, i) => (
            <motion.div key={o.to} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} whileHover={{ y: -6 }}>
              <Link to={o.to} className="home-tile flex items-center gap-5 rounded-[32px] p-6">
                <div className="grid size-24 shrink-0 place-items-center rounded-[28%] border-b-4 text-white shadow-md" style={{ background: o.color, borderColor: `color-mix(in srgb, ${o.color} 70%, #000)` }}>
                  <o.icon className="size-11" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{o.title}</div>
                  <p className="mt-1 font-bold text-home-muted">{o.text}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <Link to="/words" className="home-tile flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-extrabold text-home-muted hover:text-home-text">
          <BookOpen className="size-4 text-[#ff9a1f]" /> Eigene Wortlisten verwalten
        </Link>
      </main>
    </div>
  );
}
