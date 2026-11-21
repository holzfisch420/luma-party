/** Genres (klein, ohne Datenbank – für Einstellungen und Launcher) */
export const GENRES = {
  action: { label: 'Action', emoji: '💥', color: '#e8590c' },
  abenteuer: { label: 'Abenteuer', emoji: '🧭', color: '#2f9e44' },
  komoedie: { label: 'Komödie', emoji: '😂', color: '#f59f00' },
  drama: { label: 'Drama', emoji: '🎭', color: '#7048e8' },
  thriller: { label: 'Thriller', emoji: '🔪', color: '#495057' },
  horror: { label: 'Horror', emoji: '👻', color: '#862e9c' },
  scifi: { label: 'Sci-Fi', emoji: '🚀', color: '#1c7ed6' },
  fantasy: { label: 'Fantasy', emoji: '🐉', color: '#0ca678' },
  animation: { label: 'Animation', emoji: '🎨', color: '#e64980' },
  romantik: { label: 'Romantik', emoji: '💘', color: '#f06595' },
  krimi: { label: 'Krimi', emoji: '🕵️', color: '#343a40' },
  mystery: { label: 'Mystery', emoji: '🔮', color: '#5f3dc4' },
  familie: { label: 'Familie', emoji: '👨‍👩‍👧', color: '#74b816' },
  doku: { label: 'Doku', emoji: '🎥', color: '#1098ad' },
} as const;

export type Genre = keyof typeof GENRES;
export const GENRE_IDS = Object.keys(GENRES) as Genre[];

