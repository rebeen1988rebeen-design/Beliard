import React from 'react';
import { Ball, Language } from '../types/billiards';
import { BALL_COLORS } from '../physics/billiardsPhysics';
import { t } from '../i18n/translations';

interface PocketedBallsDisplayProps {
  balls: Ball[];
  language: Language;
}

export const PocketedBallsDisplay: React.FC<PocketedBallsDisplayProps> = ({ balls, language }) => {
  const pocketed = balls.filter((b) => b.inPocket && b.id !== 0);

  if (pocketed.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 glass px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl animate-fadeIn">
      <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium pr-1 border-r border-white/10">
        {t(language, 'pocketedBalls')}
      </span>
      <div className="flex items-center gap-1.5">
        {pocketed.map((b) => (
          <div
            key={b.id}
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/40 shadow-sm"
            style={{ backgroundColor: BALL_COLORS[b.number] || '#ffffff' }}
          >
            {b.number}
          </div>
        ))}
      </div>
    </div>
  );
};
