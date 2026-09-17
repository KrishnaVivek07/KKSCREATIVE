import React from 'react';
import { Cpu, Zap, Sparkles, Hexagon } from 'lucide-react';

interface KksLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  variant?: 'gradient' | 'glass' | 'minimal';
}

export function KksLogo({
  size = 'md',
  showText = false,
  showSubtitle = false,
  className = '',
  variant = 'gradient',
}: KksLogoProps) {
  // Dimension definitions
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 rounded-xl',
      icon: 'w-3.5 h-3.5',
      text: 'text-sm',
      sub: 'text-[9px]',
      dot: 'w-1.5 h-1.5 -top-0.5 -right-0.5',
      letterSpacing: 'tracking-tight',
    },
    md: {
      box: 'w-10 h-10 rounded-2xl',
      icon: 'w-4 h-4',
      text: 'text-base sm:text-lg',
      sub: 'text-[11px]',
      dot: 'w-2 h-2 -top-1 -right-1',
      letterSpacing: 'tracking-tight',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      icon: 'w-5 h-5',
      text: 'text-xl',
      sub: 'text-xs',
      dot: 'w-2.5 h-2.5 -top-1 -right-1',
      letterSpacing: 'tracking-normal',
    },
    xl: {
      box: 'w-16 h-16 rounded-3xl',
      icon: 'w-7 h-7',
      text: 'text-2xl',
      sub: 'text-sm',
      dot: 'w-3 h-3 -top-1.5 -right-1.5',
      letterSpacing: 'tracking-wide',
    },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Creative Holographic Insignia Icon */}
      <div className="relative group/logo">
        {/* Ambient Neon Glow Aura on Hover */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-600 opacity-40 blur-xs group-hover/logo:opacity-75 transition-opacity duration-300" />

        {/* Outer Brand Frame */}
        <div
          className={`relative ${config.box} bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-0.5 shadow-md shadow-indigo-900/30 flex items-center justify-center overflow-hidden border border-indigo-500/40 group-hover/logo:border-cyan-400/80 transition-colors`}
        >
          {/* Subtle Circuit Grid Overlay Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

          {/* Diagonal Laser Accent Shimmer */}
          <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/15 to-transparent rotate-45 pointer-events-none group-hover/logo:translate-x-full transition-transform duration-700 ease-in-out" />

          {/* Center Mark: Futuristic Stylized Monogram & Microchip Symbol */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center font-black tracking-tighter text-white font-mono leading-none drop-shadow-sm">
              <span className="text-cyan-400 group-hover/logo:text-cyan-300 transition-colors">K</span>
              <span className="text-white font-extrabold mx-[0.5px]">K</span>
              <span className="text-indigo-400 group-hover/logo:text-indigo-300 transition-colors">S</span>
            </div>

            {/* Glowing Microchip Conduit Bar */}
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="w-1 h-0.5 rounded-full bg-cyan-400/80" />
              <span className="w-2.5 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400" />
              <span className="w-1 h-0.5 rounded-full bg-indigo-400/80" />
            </div>
          </div>

          {/* Corner Hardware Registration Rivets */}
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-indigo-400/50" />
          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-cyan-400/50" />
        </div>

        {/* Live Workshop Activity LED Indicator */}
        <span
          className={`absolute ${config.dot} rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 shadow-xs shadow-emerald-500/50 flex items-center justify-center`}
          title="KKS Workshop System Active"
        >
          <span className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      </div>

      {/* Accompanying Typography if requested */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-slate-900 dark:text-white ${config.text} ${config.letterSpacing}`}
            >
              KKS
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
              LABS
            </span>
          </div>

          {showSubtitle && (
            <p
              className={`text-slate-500 dark:text-slate-400 font-medium leading-tight ${config.sub}`}
            >
              Innovate your ideas with KKS
            </p>
          )}
        </div>
      )}
    </div>
  );
}
