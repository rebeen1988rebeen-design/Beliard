import React from 'react';
import { AIDifficulty, GameMode, Language, TableTheme } from '../types/billiards';
import { TABLE_THEMES } from '../utils/tableThemes';
import { t } from '../i18n/translations';
import { X, Sparkles, Sliders, Bot, Users, Trophy } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  gameMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  tableTheme: TableTheme;
  onThemeChange: (theme: TableTheme) => void;
  aiDifficulty: AIDifficulty;
  onDifficultyChange: (diff: AIDifficulty) => void;
  showGuideline: boolean;
  onToggleGuideline: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  gameMode,
  onModeChange,
  tableTheme,
  onThemeChange,
  aiDifficulty,
  onDifficultyChange,
  showGuideline,
  onToggleGuideline,
}) => {
  if (!isOpen) return null;
  const isKu = language === 'ku';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-card max-w-xl w-full rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <Sliders className="text-emerald-400" size={24} />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              {t(language, 'settingsBtn')} & {t(language, 'theme')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Game Mode */}
          <div>
            <label className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3 block">
              {t(language, 'gameMode')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => onModeChange('8BALL_AI')}
                className={`p-3 rounded-2xl border text-sm font-medium flex items-center gap-2 transition-all ${
                  gameMode === '8BALL_AI'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Bot size={18} />
                <span>{t(language, 'mode8BallAI')}</span>
              </button>

              <button
                onClick={() => onModeChange('8BALL_PASS_PLAY')}
                className={`p-3 rounded-2xl border text-sm font-medium flex items-center gap-2 transition-all ${
                  gameMode === '8BALL_PASS_PLAY'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Users size={18} />
                <span>{t(language, 'mode8Ball2P')}</span>
              </button>

              <button
                onClick={() => onModeChange('PRACTICE')}
                className={`p-3 rounded-2xl border text-sm font-medium flex items-center gap-2 transition-all ${
                  gameMode === 'PRACTICE'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Trophy size={18} />
                <span>{t(language, 'modePractice')}</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty (If AI Mode) */}
          {gameMode === '8BALL_AI' && (
            <div>
              <label className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3 block">
                {t(language, 'difficulty')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as AIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => onDifficultyChange(diff)}
                    className={`p-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all ${
                      aiDifficulty === diff
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {diff === 'EASY'
                      ? t(language, 'diffEasy')
                      : diff === 'MEDIUM'
                      ? t(language, 'diffMedium')
                      : t(language, 'diffHard')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table Themes (Liquid Glass 3D styles) */}
          <div>
            <label className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3 block">
              {t(language, 'theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(TABLE_THEMES).map((th) => (
                <button
                  key={th.id}
                  onClick={() => onThemeChange(th.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    tableTheme === th.id
                      ? 'bg-white/15 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-white/40 shadow-inner"
                    style={{ backgroundColor: th.feltColor }}
                  />
                  <span className="text-xs md:text-sm font-medium text-left truncate">
                    {isKu ? th.nameKu : th.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Guideline Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-sm font-medium">{t(language, 'guideLineToggle')}</div>
              <div className="text-xs text-white/60">
                {isKu
                  ? 'هێڵی یارمەتیدەری لێدان لە کاتی نیشانەگرتندا بەدیار دەکەوێت'
                  : 'Displays laser trajectory prediction and ghost ball impact'}
              </div>
            </div>
            <button
              onClick={onToggleGuideline}
              className={`w-12 h-6 rounded-full transition-all relative ${
                showGuideline ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  showGuideline ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold tracking-wider uppercase transition-all"
          >
            {isKu ? 'تەواو (داخستن)' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
