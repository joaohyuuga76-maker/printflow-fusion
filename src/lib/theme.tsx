import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Mode = "dark" | "light";
export type PresetId = "polycraft" | "padrao";

export type Palette = {
  background: string;
  card: string;
  primary: string;
  foreground: string;
  border: string;
};

export type Adjust = {
  primary: string | null; // hex override
  hue: number; // -180..180
  sat: number; // 0..200 (%)
  temp: number; // -100..100 (frio -> quente)
};

export type ThemeConfig = {
  mode: Mode;
  preset: PresetId;
  custom: Record<Mode, Adjust>;
};

export const PRESETS: Record<PresetId, { label: string; hint: string; palettes: Record<Mode, Palette> }> = {
  polycraft: {
    label: "Polycraft 3D (Oficial)",
    hint: "Grafite profundo + azul metálico",
    palettes: {
      dark: {
        background: "#0E1116",
        card: "#161B22",
        primary: "#1E6FD9",
        foreground: "#F2F6FA",
        border: "#232B36",
      },
      light: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        primary: "#0F4C81",
        foreground: "#0F172A",
        border: "#E2E8F0",
      },
    },
  },
  padrao: {
    label: "Padrão Atual",
    hint: "Azul escuro com destaque verde neon",
    palettes: {
      dark: {
        background: "#1E293B",
        card: "#334155",
        primary: "#2CC46A",
        foreground: "#F1F5F9",
        border: "#3E4C63",
      },
      light: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        primary: "#2F9E5F",
        foreground: "#1E293B",
        border: "#DDE3EA",
      },
    },
  },
};

export const DEFAULT_CONFIG: ThemeConfig = {
  mode: "dark",
  preset: "polycraft",
  custom: {
    dark: { primary: null, hue: 0, sat: 100, temp: 0 },
    light: { primary: null, hue: 0, sat: 100, temp: 0 },
  },
};

const KEY = "printflow-appearance";

/* ---------- color helpers ---------- */
type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + 360) % 360;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: HSL): string {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hh = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ln - c / 2;
  const seg = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(hh / 60) % 6]!;
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(seg[0]!)}${to(seg[1]!)}${to(seg[2]!)}`;
}

const shift = (hex: string, dl: number, ds = 0) => {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h, s: Math.max(0, c.s + ds), l: Math.max(0, Math.min(100, c.l + dl)) });
};

const readable = (hex: string) => (hexToHsl(hex).l > 62 ? "#0B1017" : "#FFFFFF");

/* ---------- palette resolution ---------- */
export function resolvePalette(cfg: ThemeConfig): Palette {
  const base = PRESETS[cfg.preset].palettes[cfg.mode];
  const adj = cfg.custom[cfg.mode];
  const p = hexToHsl(adj.primary ?? base.primary);
  const primary = hslToHex({
    h: p.h + adj.hue,
    s: Math.min(100, p.s * (adj.sat / 100)),
    l: p.l,
  });
  // temperatura: desloca a matiz dos neutros para azul (frio) ou laranja (quente)
  const warm = adj.temp / 100; // -1 frio ... 1 quente
  const tint = (hex: string, strength: number) => {
    const c = hexToHsl(hex);
    const targetH = warm >= 0 ? 32 : 220;
    const amount = Math.abs(warm) * strength;
    return hslToHex({
      h: c.h + (targetH - c.h) * Math.min(1, amount / 6),
      s: Math.min(100, c.s + amount),
      l: c.l,
    });
  };
  return {
    background: tint(base.background, 6),
    card: tint(base.card, 5),
    border: tint(base.border, 4),
    foreground: base.foreground,
    primary,
  };
}

export function paletteVars(pal: Palette, mode: Mode): Record<string, string> {
  const dark = mode === "dark";
  const step = (n: number) => (dark ? n : -n);
  const muted = shift(pal.card, step(4));
  const mutedFg = shift(pal.foreground, dark ? -28 : 34, -20);
  const accent = shift(pal.card, step(8));
  const surface = shift(pal.card, step(3));
  return {
    "--background": pal.background,
    "--foreground": pal.foreground,
    "--card": pal.card,
    "--card-foreground": pal.foreground,
    "--popover": pal.card,
    "--popover-foreground": pal.foreground,
    "--primary": pal.primary,
    "--primary-foreground": readable(pal.primary),
    "--secondary": accent,
    "--secondary-foreground": pal.foreground,
    "--muted": muted,
    "--muted-foreground": mutedFg,
    "--accent": accent,
    "--accent-foreground": pal.foreground,
    "--border": pal.border,
    "--input": pal.border,
    "--ring": pal.primary,
    "--sidebar": shift(pal.background, dark ? 2 : 2),
    "--sidebar-foreground": pal.foreground,
    "--sidebar-primary": pal.primary,
    "--sidebar-primary-foreground": readable(pal.primary),
    "--sidebar-accent": accent,
    "--sidebar-accent-foreground": pal.foreground,
    "--sidebar-border": pal.border,
    "--sidebar-ring": pal.primary,
    "--color-surface": surface,
  };
}

export function applyTheme(cfg: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", cfg.mode === "light");
  const vars = paletteVars(resolvePalette(cfg), cfg.mode);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

function load(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = localStorage.getItem("printflow-theme");
      return legacy === "light" ? { ...DEFAULT_CONFIG, mode: "light" } : DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
    return {
      mode: parsed.mode === "light" ? "light" : "dark",
      preset: parsed.preset === "padrao" ? "padrao" : "polycraft",
      custom: {
        dark: { ...DEFAULT_CONFIG.custom.dark, ...(parsed.custom?.dark ?? {}) },
        light: { ...DEFAULT_CONFIG.custom.light, ...(parsed.custom?.light ?? {}) },
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

type Ctx = {
  config: ThemeConfig;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setPreset: (p: PresetId) => void;
  setAdjust: (patch: Partial<Adjust>, mode?: Mode) => void;
  resetAll: () => void;
  resetCustom: () => void;
  palette: Palette;
};

let current: ThemeConfig = DEFAULT_CONFIG;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return DEFAULT_CONFIG;
}

function commit(next: ThemeConfig) {
  current = next;
  applyTheme(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem("printflow-theme", next.mode);
  } catch {
    /* ignore */
  }
  emit();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  current = load();
  applyTheme(current);
  emit();
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrate();
  }, []);
  return <>{children}</>;
}

export function useAppearance(): Ctx {
  const config = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    hydrate();
  }, []);

  return useMemo<Ctx>(
    () => ({
      config,
      palette: resolvePalette(config),
      setMode: (mode) => commit({ ...config, mode }),
      toggleMode: () => commit({ ...config, mode: config.mode === "dark" ? "light" : "dark" }),
      setPreset: (preset) => commit({ ...config, preset }),
      setAdjust: (patch, mode) => {
        const m = mode ?? config.mode;
        commit({ ...config, custom: { ...config.custom, [m]: { ...config.custom[m], ...patch } } });
      },
      resetCustom: () =>
        commit({
          ...config,
          custom: { dark: { ...DEFAULT_CONFIG.custom.dark }, light: { ...DEFAULT_CONFIG.custom.light } },
        }),
      resetAll: () => {
        try {
          localStorage.removeItem(KEY);
          localStorage.removeItem("printflow-theme");
        } catch {
          /* ignore */
        }
        current = DEFAULT_CONFIG;
        applyTheme(DEFAULT_CONFIG);
        emit();
      },
    }),
    [config],
  );
}
