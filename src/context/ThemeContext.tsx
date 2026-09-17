import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'cyan' | 'rose' | 'violet';
export type UiDensity = 'normal' | 'compact';

export interface ThemeSettings {
  mode: ThemeMode;
  accentColor: AccentColor;
  oledMode: boolean;
  density: UiDensity;
}

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  accentColor: AccentColor;
  oledMode: boolean;
  density: UiDensity;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setAccentColor: (accent: AccentColor) => void;
  setOledMode: (oled: boolean) => void;
  setDensity: (density: UiDensity) => void;
  resetTheme: () => void;
  isCustomizerOpen: boolean;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  accentClasses: {
    badge: string;
    button: string;
    border: string;
    text: string;
  };
}

const STORAGE_KEY = 'kks_workshop_theme_v2';

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'system',
  accentColor: 'indigo',
  oledMode: false,
  density: 'normal',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_PALETTES: {
  id: AccentColor;
  name: string;
  description: string;
  hex: string;
  badge: string;
  button: string;
  border: string;
  text: string;
}[] = [
  {
    id: 'indigo',
    name: 'Precision Indigo',
    description: 'Modern workshop & IoT high-tech blue',
    hex: '#4f46e5',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    border: 'border-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'emerald',
    name: 'PCB Copper Emerald',
    description: 'Hardware circuit board & solder mask green',
    hex: '#059669',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'amber',
    name: 'Soldering Flux Amber',
    description: 'Warm gold, brass hardware & soldering glow',
    hex: '#d97706',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'cyan',
    name: 'Silicon Logic Cyan',
    description: 'Logic analyzer, oscilloscope & MCU traces',
    hex: '#0891b2',
    badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    border: 'border-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'rose',
    name: 'High Voltage Crimson',
    description: 'Power electronics, telemetry & warnings',
    hex: '#e11d48',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
    border: 'border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'violet',
    name: 'Firmware Violet',
    description: 'Microcontroller firmware & embedded code',
    hex: '#7c3aed',
    badge: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
    border: 'border-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Load saved preferences from localStorage
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load theme from storage, using defaults');
    }
    return DEFAULT_SETTINGS;
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute effective dark state
  const isDark =
    settings.mode === 'dark' || (settings.mode === 'system' && systemDark);

  // Apply DOM classes whenever settings or system theme changes
  useEffect(() => {
    const root = document.documentElement;

    // 1. Dark class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. OLED Mode
    if (isDark && settings.oledMode) {
      root.classList.add('oled-black');
    } else {
      root.classList.remove('oled-black');
    }

    // 3. Accent dataset attribute
    root.setAttribute('data-theme-accent', settings.accentColor);

    // 4. Density attribute
    root.setAttribute('data-theme-density', settings.density);

    // 5. Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save theme to localStorage');
    }
  }, [settings, isDark]);

  const setMode = (mode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  const toggleTheme = () => {
    // Quick toggle switches between light and dark
    setSettings((prev) => {
      const nextMode: ThemeMode = isDark ? 'light' : 'dark';
      return { ...prev, mode: nextMode };
    });
  };

  const setAccentColor = (accentColor: AccentColor) => {
    setSettings((prev) => ({ ...prev, accentColor }));
  };

  const setOledMode = (oledMode: boolean) => {
    setSettings((prev) => ({ ...prev, oledMode }));
  };

  const setDensity = (density: UiDensity) => {
    setSettings((prev) => ({ ...prev, density }));
  };

  const resetTheme = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const currentPalette =
    ACCENT_PALETTES.find((p) => p.id === settings.accentColor) ||
    ACCENT_PALETTES[0];

  return (
    <ThemeContext.Provider
      value={{
        mode: settings.mode,
        isDark,
        accentColor: settings.accentColor,
        oledMode: settings.oledMode,
        density: settings.density,
        setMode,
        toggleTheme,
        setAccentColor,
        setOledMode,
        setDensity,
        resetTheme,
        isCustomizerOpen,
        openCustomizer: () => setIsCustomizerOpen(true),
        closeCustomizer: () => setIsCustomizerOpen(false),
        accentClasses: {
          badge: currentPalette.badge,
          button: currentPalette.button,
          border: currentPalette.border,
          text: currentPalette.text,
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
