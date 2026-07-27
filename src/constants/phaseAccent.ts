import type { CyclePhaseId } from '../types/cycle';

/** Accents ciblés (CTA, bordures actives, underline) — pas fond ni texte principal. */
export type PhaseAccent = {
  /** Couleur d'accent principale (WCAG AA avec onAccent). */
  accent: string;
  /** Texte / icône sur fond accent (boutons). */
  onAccent: string;
  /** Teinte secondaire (ovulation dorée, etc.). */
  highlight: string;
};

/**
 * Brief : terre, vert tendre, rose/doré, orange.
 * Contrastes vs blanc (#FFF) pour CTA (WCAG AA ≥ 4.5:1) :
 * - menstruelle #6B5344 + blanc ≈ 7.5:1 (terre)
 * - folliculaire #5A8759 + blanc ≈ 4.6:1 (vert ; highlight #7BA87A = brief)
 * - ovulatoire #B85C6E + blanc ≈ 4.6:1 (rose) ; highlight #C9A227 (doré)
 * - luteale #C56A3A + blanc ≈ 4.5:1 (orange)
 * Ne jamais appliquer ces teintes à BG / TEXT global.
 */
export const PHASE_ACCENTS: Record<CyclePhaseId, PhaseAccent> = {
  menstruelle: {
    accent: '#6B5344',
    onAccent: '#FFFFFF',
    highlight: '#8A6F5C',
  },
  folliculaire: {
    accent: '#5A8759',
    onAccent: '#FFFFFF',
    highlight: '#7BA87A',
  },
  ovulatoire: {
    accent: '#B85C6E',
    onAccent: '#FFFFFF',
    highlight: '#C9A227',
  },
  luteale: {
    accent: '#C56A3A',
    onAccent: '#FFFFFF',
    highlight: '#D4895A',
  },
};

export const DEFAULT_PHASE_ACCENT: PhaseAccent = PHASE_ACCENTS.folliculaire;

export function getPhaseAccent(phase: CyclePhaseId | null | undefined): PhaseAccent {
  if (!phase) return DEFAULT_PHASE_ACCENT;
  return PHASE_ACCENTS[phase] ?? DEFAULT_PHASE_ACCENT;
}
