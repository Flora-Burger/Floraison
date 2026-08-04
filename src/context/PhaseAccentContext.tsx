import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { CyclePhaseId } from '../types/cycle';
import {
  DEFAULT_PHASE_ACCENT,
  getChromeColor,
  getPhaseAccent,
  type PhaseAccent,
} from '../constants/phaseAccent';
import { ROSE_DEEP } from '../constants/theme';

type PhaseAccentContextValue = {
  phase: CyclePhaseId | null;
  accent: PhaseAccent;
  /** Marque UI (titre, onglets, réglages) — rose pendant les règles. */
  chrome: string;
  setPhase: (phase: CyclePhaseId | null) => void;
};

const PhaseAccentContext = createContext<PhaseAccentContextValue>({
  phase: null,
  accent: DEFAULT_PHASE_ACCENT,
  chrome: ROSE_DEEP,
  setPhase: () => undefined,
});

function applyWebCssVar(accent: PhaseAccent, chrome: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-phase', accent.accent);
  root.style.setProperty('--accent-phase-on', accent.onAccent);
  root.style.setProperty('--accent-phase-highlight', accent.highlight);
  root.style.setProperty('--accent-chrome', chrome);
  if (!document.getElementById('floraison-accent-transition')) {
    const style = document.createElement('style');
    style.id = 'floraison-accent-transition';
    style.textContent = `
      :root {
        --accent-phase: ${accent.accent};
        --accent-phase-on: ${accent.onAccent};
        --accent-phase-highlight: ${accent.highlight};
        --accent-chrome: ${chrome};
      }
      button, a, [data-accent-phase] {
        transition: color 0.4s ease, border-color 0.4s ease, background-color 0.4s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

export function PhaseAccentProvider({
  phase: controlledPhase,
  children,
}: {
  phase?: CyclePhaseId | null;
  children: ReactNode;
}) {
  const [internalPhase, setInternalPhase] = useState<CyclePhaseId | null>(
    controlledPhase ?? null,
  );

  const phase = controlledPhase !== undefined ? controlledPhase : internalPhase;
  const accent = useMemo(() => getPhaseAccent(phase), [phase]);
  const chrome = useMemo(() => getChromeColor(phase), [phase]);

  useEffect(() => {
    applyWebCssVar(accent, chrome);
  }, [accent, chrome]);

  const setPhase = useCallback((next: CyclePhaseId | null) => {
    setInternalPhase(next);
  }, []);

  const value = useMemo(
    () => ({ phase, accent, chrome, setPhase }),
    [phase, accent, chrome, setPhase],
  );

  return (
    <PhaseAccentContext.Provider value={value}>{children}</PhaseAccentContext.Provider>
  );
}

export function usePhaseAccent(): PhaseAccentContextValue {
  return useContext(PhaseAccentContext);
}
