import React, { useEffect } from 'react';
import { Language, Player } from '../types/billiards';
import { t } from '../i18n/translations';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, XCircle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface WinnerModalProps {
  winner: Player | null;
  winReason: string | null;
  winReasonKu: string | null;
  onPlayAgain: () => void;
  language: Language;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  winReason,
  winReasonKu,
  onPlayAgain,
  language,
}) => {
  useEffect(() => {
    if (winner) {
      soundEngine.playWinSound();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [winner]);

  if (!winner) return null;

  const isKu = language === 'ku';
  const isHumanWin = winner.type === 'HUMAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 animate-fadeIn">
      <div className="glass-card max-w-lg w-full rounded-3xl p-8 border border-white/20 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div
          className={`absolute w-64 h-64 rounded-full blur-[90px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 ${
            isHumanWin ? 'bg-emerald-500/30' : 'bg-rose-500/30'
          }`}
        />

        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
          {isHumanWin ? <Trophy className="text-emerald-400" size={40} /> : <XCircle className="text-rose-400" size={40} />}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide mb-2">
          {isHumanWin ? t(language, 'winTitle') : t(language, 'loseTitle')}
        </h2>

        <div className="text-lg font-bold text-emerald-400 mb-4">
          {winner.avatar} {isKu ? winner.nameKu : winner.name}
        </div>

        <p className="text-sm md:text-base text-white/80 leading-relaxed mb-8 px-4">
          {isKu ? winReasonKu || winReason : winReason}
        </p>

        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold tracking-[0.15em] uppercase shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          <span>{t(language, 'playAgain')}</span>
        </button>
      </div>
    </div>
  );
};
