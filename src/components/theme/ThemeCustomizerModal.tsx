import React from 'react';
import { useTheme, ACCENT_PALETTES, ThemeMode, AccentColor } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  CheckCircle2,
  Cpu,
  Receipt,
  Layers,
} from 'lucide-react';

export function ThemeCustomizerModal() {
  const {
    mode,
    isDark,
    accentColor,
    oledMode,
    density,
    setMode,
    setAccentColor,
    setOledMode,
    setDensity,
    resetTheme,
    isCustomizerOpen,
    closeCustomizer,
    accentClasses,
  } = useTheme();

  if (!isCustomizerOpen) return null;

  const currentAccent = ACCENT_PALETTES.find((p) => p.id === accentColor) || ACCENT_PALETTES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Theme & Appearance Customization</h2>
              <p className="text-xs text-indigo-200">
                Personalize Light/Dark modes, workshop accent colors, and OLED contrast
              </p>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* 1. Theme Mode: Light, Dark, System */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Color Theme Mode</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Currently active:{' '}
                <strong className="text-slate-900 dark:text-white uppercase font-mono">
                  {mode} ({isDark ? 'Dark Surface' : 'Light Surface'})
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Mode Card */}
              <div
                id="theme-mode-light-btn"
                onClick={() => setMode('light')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  mode === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <Sun className="w-5 h-5" />
                    </div>
                    {mode === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Light Mode</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crisp daylight workshop palette with clean white surfaces and high contrast.
                  </p>
                </div>

                {/* Micro UI Preview */}
                <div className="mt-3 p-2 rounded-xl bg-slate-100 border border-slate-200/80 space-y-1">
                  <div className="w-12 h-1.5 bg-slate-400 rounded-full" />
                  <div className="w-full h-3 bg-white rounded border border-slate-300" />
                </div>
              </div>

              {/* Dark Mode Card */}
              <div
                id="theme-mode-dark-btn"
                onClick={() => setMode('dark')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  mode === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-indigo-900/60 text-indigo-400">
                      <Moon className="w-5 h-5" />
                    </div>
                    {mode === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dark Mode</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Low-glare midnight slate for late-night bench testing & firmware flashing.
                  </p>
                </div>

                {/* Micro UI Preview */}
                <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="w-12 h-1.5 bg-indigo-400 rounded-full" />
                  <div className="w-full h-3 bg-slate-800 rounded border border-slate-700" />
                </div>
              </div>

              {/* System Card */}
              <div
                id="theme-mode-system-btn"
                onClick={() => setMode('system')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  mode === 'system'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Laptop className="w-5 h-5" />
                    </div>
                    {mode === 'system' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    System Synchronized
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Automatically matches your device operating system dark/light schedule.
                  </p>
                </div>

                {/* Micro UI Preview */}
                <div className="mt-3 p-2 rounded-xl bg-gradient-to-r from-slate-100 to-slate-900 border border-slate-300 dark:border-slate-700 space-y-1">
                  <div className="w-12 h-1.5 bg-indigo-500 rounded-full" />
                  <div className="w-full h-3 bg-slate-500/20 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. AMOLED Deep Black Option (for Dark Mode) */}
          {isDark && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  AMOLED Pure Black Canvas
                </span>
                <p className="text-slate-500 text-[11px]">
                  Enables true 100% black (#000000) backgrounds for OLED displays and maximum contrast.
                </p>
              </div>

              <button
                type="button"
                id="toggle-oled-mode-btn"
                onClick={() => setOledMode(!oledMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  oledMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    oledMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* 3. Workshop Accent Color Palette */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Workshop Accent Color Palette</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Active: <strong className="text-slate-900 dark:text-white">{currentAccent.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCENT_PALETTES.map((palette) => {
                const isSelected = accentColor === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setAccentColor(palette.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-slate-50 dark:bg-slate-800 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10"
                        style={{ backgroundColor: palette.hex }}
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {palette.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{palette.id}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Live Interactive Workshop Preview Panel */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>Live Component Visual Preview</span>
              </span>
              <span className="text-[10px] text-slate-400">Updates instantly</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: currentAccent.hex }}
                  >
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      IoT Environmental Node V2
                    </div>
                    <div className="text-[10px] text-slate-400">Project Reference #PRJ-8910</div>
                  </div>
                </div>

                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${currentAccent.hex}15`,
                    color: currentAccent.hex,
                    borderColor: `${currentAccent.hex}40`,
                  }}
                >
                  ENGINEERING ACTIVE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs transition-opacity hover:opacity-90"
                  style={{ backgroundColor: currentAccent.hex }}
                >
                  Flash Firmware
                </button>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  View Schematics
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={resetTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="button"
              id="close-theme-customizer-btn"
              onClick={closeCustomizer}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
