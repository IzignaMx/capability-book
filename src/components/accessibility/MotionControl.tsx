import type { Locale } from "../../domain/projects/PortfolioProject";

export type MotionControlState = "reduce" | "restore" | "unavailable";

export interface MotionControlProps {
  readonly locale: Locale;
  readonly state: MotionControlState;
  readonly onToggle: () => void;
}

const COPY = {
  es: {
    reduce: "Reducir movimiento avanzado",
    restore: "Restaurar movimiento avanzado",
    unavailable: "Movimiento avanzado no disponible"
  },
  en: {
    reduce: "Reduce advanced motion",
    restore: "Restore advanced motion",
    unavailable: "Advanced motion unavailable"
  }
} as const;

export function resolveMotionControlState(
  explicitlyReduced: boolean,
  systemAllowsAdvanced: boolean
): MotionControlState {
  if (explicitlyReduced) return "restore";
  return systemAllowsAdvanced ? "reduce" : "unavailable";
}

export function MotionControl({ locale, state, onToggle }: MotionControlProps) {
  const disabled = state === "unavailable";

  return (
    <button
      type="button"
      aria-pressed={state === "restore"}
      disabled={disabled}
      onClick={onToggle}
    >
      {COPY[locale][state]}
    </button>
  );
}
