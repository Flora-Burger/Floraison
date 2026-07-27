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
  getPhaseAccent,
  type PhaseAccent,
} from '../constants/phaseAccent';

type PhaseAccentContextValue = {
  phase: CyclePhaseId | null;
  accent: PhaseAccent;
  setPhase: (phase: CyclePhaseId | null) => void;
};

const PhaseAccentContext = createContext<PhaseAccentContextValue>({
  phase: null,
  accent: DEFAULT_PHASE_ACCENT,
  setPhase: () => undefined,
});

function applyWebCssVar(accent: PhaseAccent) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-phase', accent.accent);
  root.style.setProperty('--accent-phase-on', accent.onAccent);
  root.style.setProperty('--accent-phase-highlight', accent.highlight);
  if (!document.getElementById('floraison-accent-transition')) {
    const style = document.createElement('style');
    style.id = 'floraison-accent-transition';
    style.textContent = `
      :root {
        --accent-phase: ${accent.accent};
        --accent-phase-on: ${accent.onAccent};
        --accent-phase-highlight: ${accent.highlight};
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

  useEffect(() => {
    applyWebCssVar(accent);
  }, [accent]);

  const setPhase = useCallback((next: CyclePhaseId | null) => {
    setInternalPhase(next);
  }, []);

  const value = useMemo(
    () => ({ phase, accent, setPhase }),
    [phase, accent, setPhase],
  );

  return (
    <PhaseAccentContext.Provider value={value}>{children}</PhaseAccentContext.Provider>
  );
}

export function usePhaseAccent(): PhaseAccentContextValue {
  return useContext(PhaseAccentContext);
}
