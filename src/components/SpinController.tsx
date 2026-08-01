import React, { useRef } from 'react';
import { ShotSpin, Language } from '../types/billiards';
import { t } from '../i18n/translations';

interface SpinControllerProps {
  spin: ShotSpin;
  onChange: (spin: ShotSpin) => void;
  language: Language;
}

export const SpinController: React.FC<SpinControllerProps> = ({ spin, onChange, language }) => {
  const circleRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Constrain inside unit circle
    const dist = Math.sqrt(x * x + y * y);
    if (dist <= 1) {
      onChange({ x: Number(x.toFixed(2)), y: Number((-y).toFixed(2)) });
    } else {
      const angle = Math.atan2(-y, x);
      onChange({
        x: Number(Math.cos(angle).toFixed(2)),
        y: Number(Math.sin(angle).toFixed(2)),
      });
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ x: 0, y: 0 });
  };

  // Convert spin coordinate to visual percentage
  const dotLeft = ((spin.x + 1) / 2) * 100;
  const dotTop = (((-spin.y) + 1) / 2) * 100;

  return (
    <div className="glass p-4 rounded-2xl w-48 shrink-0 select-none border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
          {t(language, 'spinTitle')}
        </span>
        {(spin.x !== 0 || spin.y !== 0) && (
          <button
            onClick={handleReset}
            className="text-[10px] text-rose-400 hover:text-rose-300 underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Interactive mini cue ball */}
        <div
          ref={circleRef}
          onClick={handleClick}
          className="relative w-24 h-24 rounded-full cursor-pointer overflow-hidden border border-white/30 shadow-inner bg-gradient-to-br from-white via-slate-100 to-slate-300 flex items-center justify-center transition-transform hover:scale-105"
        >
          {/* Aiming crosshairs inside ball */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-full h-px bg-slate-900"></div>
            <div className="h-full w-px bg-slate-900 absolute"></div>
          </div>

          {/* Red impact dot */}
          <div
            className="absolute w-3.5 h-3.5 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)] -translate-x-1/2 -translate-y-1/2 transition-all duration-150 border border-white"
            style={{ left: `${dotLeft}%`, top: `${dotTop}%` }}
          />
        </div>

        <div className="mt-2 text-center text-xs font-mono text-emerald-300">
          {spin.y > 0.1
            ? `${t(language, 'topSpin')} +${Math.round(spin.y * 100)}%`
            : spin.y < -0.1
            ? `${t(language, 'backSpin')} ${Math.round(spin.y * 100)}%`
            : 'Center (سووڕانەوەی ئاسایی)'}
        </div>
      </div>
    </div>
  );
};
