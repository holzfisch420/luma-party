import type { ScoringConfig } from '../game-config';

/**
 * Punkte für einen richtigen Rater.
 * @param rankIndex 0 = erster richtiger Rater
 * @param remainingFraction Restzeit 0..1
 */
export function guesserPoints(cfg: ScoringConfig, rankIndex: number, remainingFraction: number): number {
  const base = Math.max(cfg.minGuessPoints, cfg.firstGuessPoints - rankIndex * cfg.pointsDecrement);
  const bonus = Math.round(cfg.timeBonusMax * Math.min(1, Math.max(0, remainingFraction)));
  return base + bonus;
}

export function drawerPoints(cfg: ScoringConfig): number {
  return cfg.drawerPointsPerGuess;
}
