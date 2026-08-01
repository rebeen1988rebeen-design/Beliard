import React from 'react';
import { GameMode, Language, Player, TableTheme } from '../types/billiards';
import { TABLE_THEMES } from '../utils/tableThemes';
import { t } from '../i18n/translations';
import { Volume2, VolumeX, Settings, Trophy, Sparkles, RefreshCw, Eye } from 'lucide-react';

interface TopNavbarProps {
  players: [Player, Player];
  activePlayerIndex: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  gameMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  tableTheme: TableTheme;
  onThemeChange: (theme: TableTheme) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onResetRack: () => void;
  onOpenRules: () => void;
  tableOpen: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  players,
  activePlayerIndex,
  language,
  onLanguageChange,
  gameMode,
  onModeChange,
  tableTheme,
  onThemeChange,
  soundEnabled,
  onSoundToggle,
  onResetRack,
  onOpenRules,
  tableOpen,
}) => {
  const isKu = language === 'ku';

  return (
    <nav className="h-20 glass flex items-center justify-between px-4 md:px-8 z-40 shrink-0 border-b border-white/10 select-none">
      {/* Left: Player 1 Status */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all ${
          activePlayerIndex === 0 ? 'bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'opacity-70'
        }`}>
          <span className="text-2xl">{players[0].avatar}</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold">
              {isKu ? 'یاریزان ١' : 'PLAYER 1'}
            </span>
            <span className="text-sm md:text-base font-medium tracking-tight truncate max-w-[110px]">
              {isKu ? players[0].nameKu : players[0].name}
            </span>
            <span className="text-[10px] font-mono opacity-60">
              {players[0].assignedGroup === 'SOLID'
                ? t(language, 'solids')
                : players[0].assignedGroup === 'STRIPE'
                ? t(language, 'stripes')
                : t(language, 'noGroup')}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
        <div className="text-3xl md:text-4xl font-bold font-mono text-emerald-400">
          {players[0].score.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Center: Title & Mode Indicator */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🎱</span>
          <h1 className="text-base md:text-xl font-light tracking-[0.2em] uppercase">
            {isKu ? (
              <span className="font-bold">بلیاردی ٣ دی <span className="text-emerald-400 font-normal text-xs ml-1">GLOW</span></span>
            ) : (
              <>BILLIARD <span className="font-bold text-emerald-400">ELITE</span></>
            )}
          </h1>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-300 font-mono tracking-wider">
              {gameMode === '8BALL_AI'
                ? (isKu ? '٨-تۆپ (دژی زیرەکی)' : '8-BALL vs AI')
                : gameMode === '8BALL_PASS_PLAY'
                ? (isKu ? '٨-تۆپ (٢ یاریزان)' : '8-BALL 2 PLAYERS')
                : (isKu ? 'ڕاهێنان و تاقیکردنەوە' : 'PRACTICE MODE')}
            </span>
          </div>

          {tableOpen && (
            <span className="hidden md:inline-block text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              {t(language, 'tableOpen')}
            </span>
          )}
        </div>
      </div>

      {/* Right: Player 2 Status + Control Toolbar */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-3xl md:text-4xl font-bold font-mono">
          {players[1].score.toString().padStart(2, '0')}
        </div>
        <div className="h-10 w-px bg-white/10 hidden sm:block"></div>

        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all ${
          activePlayerIndex === 1 ? 'bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'opacity-70'
        }`}>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold">
              {isKu ? 'یاریزان ٢' : 'PLAYER 2'}
            </span>
            <span className="text-sm md:text-base font-medium tracking-tight truncate max-w-[110px]">
              {isKu ? players[1].nameKu : players[1].name}
            </span>
            <span className="text-[10px] font-mono opacity-60">
              {players[1].assignedGroup === 'SOLID'
                ? t(language, 'solids')
                : players[1].assignedGroup === 'STRIPE'
                ? t(language, 'stripes')
                : t(language, 'noGroup')}
            </span>
          </div>
          <span className="text-2xl">{players[1].avatar}</span>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
          {/* Sound toggle */}
          <button
            onClick={onSoundToggle}
            title={soundEnabled ? t(language, 'soundOn') : t(language, 'soundOff')}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled ? 'bg-white/10 text-emerald-300 hover:bg-white/15' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reset rack button */}
          <button
            onClick={onResetRack}
            title={t(language, 'resetRack')}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all"
          >
            <RefreshCw size={16} />
          </button>

          {/* Language toggle: KU / EN */}
          <button
            onClick={() => onLanguageChange(language === 'ku' ? 'en' : 'ku')}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all"
          >
            {language === 'ku' ? 'EN' : 'کوردی'}
          </button>
        </div>
      </div>
    </nav>
  );
};
