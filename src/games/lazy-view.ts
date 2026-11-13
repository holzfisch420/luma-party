/**
 * Spielansichten erst laden, wenn sie gebraucht werden (eigene Datei je Spiel).
 * `preload()` lädt vorab – z. B. sobald das Startfenster eines Spiels offen ist.
 */
import { lazy, type ComponentType } from 'react';
import type React from 'react';

export type LazyView<P> = ComponentType<P> & { preload: () => Promise<unknown> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyView<M extends Record<string, any>, K extends keyof M & string>(load: () => Promise<M>, name: K): LazyView<React.ComponentProps<M[K]>> {
  type P = React.ComponentProps<M[K]>;
  let promise: Promise<{ default: ComponentType<P> }> | null = null;
  const get = () => (promise ??= load().then((m) => ({ default: m[name] as ComponentType<P> })));
  const C = lazy(get) as unknown as LazyView<P>;
  C.preload = get;
  return C;
}
