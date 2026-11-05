import { useEffect, useMemo } from 'react';
import { useGameEvent } from '../../../app/session/hooks';
import { StrokeModel } from '../logic/stroke-model';
import { MM_EVENTS, type CanvasSyncEvent, type DrawEvent } from '../types';

/**
 * Empfängt Zeichenoperationen und Synchronisationen vom Server.
 * Operationen werden der Zugnummer zugeordnet, damit sich Züge nie vermischen.
 */
export function useRemoteCanvas(turn: number): StrokeModel {
  const model = useMemo(() => new StrokeModel(), []);

  useEffect(() => {
    if (turn > model.turn) model.reset(turn);
  }, [turn, model]);

  useGameEvent<DrawEvent>(MM_EVENTS.draw, (e) => {
    if (e.turn > model.turn) model.reset(e.turn);
    if (e.turn !== model.turn) return;
    for (const op of e.ops) model.apply(op);
  });

  useGameEvent<CanvasSyncEvent>(MM_EVENTS.canvasSync, (e) => {
    if (e.turn >= model.turn) model.load(e.turn, e.strokes);
  });

  return model;
}
