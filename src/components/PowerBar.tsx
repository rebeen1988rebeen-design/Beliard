import React, { useRef, useState } from 'react';
import { Language } from '../types/billiards';
import { t } from '../i18n/translations';

interface PowerBarProps {
  power: number; // 0 to 1
  onChange: (newPower: number) => void;
  onShoot: () => void;
  disabled: boolean;
  language: Language;
}

export const PowerBar: React.FC<PowerBarProps> = ({
  power,
  onChange,
  onShoot,
  disabled,
  language,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updatePowerFromEvent = (clientY: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    // Top = 100% power, bottom = 0% power
    const ratio = 1 - relativeY / rect.height;
    const clamped = Math.min(Math.max(ratio, 0.05), 1);
    onChange(Number(clamped.toFixed(2)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updatePowerFromEvent(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePowerFromEvent(e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const percentage = Math.round(power * 100);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Liquid Glass Vertical Power Meter */}
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-12 h-64 glass rounded-full p-1.5 flex flex-col items-center justify-end overflow-hidden cursor-ns-resize transition-all border border-white/20 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400/60'
        }`}
        title={t(language, 'power')}
      >
        <div
          className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-300 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-75"
          style={{ height: `${percentage}%` }}
        >
          {/* Wave shine effect */}
          <div className="w-full h-2 bg-white/40 rounded-full mb-1 animate-pulse" />
        </div>
      </div>

      <div className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
        {percentage}%
      </div>

      <div className="text-[10px] uppercase tracking-widest opacity-60">
        Power Level
      </div>
    </div>
  );
};
