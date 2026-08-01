import React from 'react';
import { CameraMode, Language } from '../types/billiards';
import { t } from '../i18n/translations';
import { Settings, BookOpen, Eye, Target, Compass, Play, RotateCcw } from 'lucide-react';

interface BottomHUDProps {
  cueAngle: number;
  power: number;
  onShoot: () => void;
  canShoot: boolean;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  showGuideline: boolean;
  onToggleGuideline: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  language: Language;
  onUndo?: () => void;
  showUndo?: boolean;
}

export const BottomHUD: React.FC<BottomHUDProps> = ({
  cueAngle,
  power,
  onShoot,
  canShoot,
  cameraMode,
  onCameraChange,
  showGuideline,
  onToggleGuideline,
  onOpenRules,
  onOpenSettings,
  language,
  onUndo,
  showUndo,
}) => {
  const isKu = language === 'ku';

  // Normalize angle to degrees 0-360 for display
  const degrees = Math.round(((cueAngle * (180 / Math.PI)) % 360 + 360) % 360);
  const powerPercentage = Math.round(power * 100);

  return (
    <div className="h-24 md:h-28 glass mx-4 md:mx-10 mb-4 md:mb-8 rounded-3xl flex items-center justify-between px-4 md:px-10 z-40 select-none border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
      {/* Left: Quick Actions & View Toggles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          title={t(language, 'settingsBtn')}
          className="liquid-button w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl text-white/80 hover:text-white"
        >
          <Settings size={20} />
        </button>

        <button
          onClick={onOpenRules}
          title={t(language, 'rulesTitle')}
          className="liquid-button w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl text-white/80 hover:text-white"
        >
          <BookOpen size={20} />
        </button>

        {/* Camera mode selector pill */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => onCameraChange('AIM')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              cameraMode === 'AIM'
                ? 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Target size={14} />
            <span>{isKu ? 'نیشانە' : 'Aim'}</span>
          </button>
          <button
            onClick={() => onCameraChange('TOP')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              cameraMode === 'TOP'
                ? 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Eye size={14} />
            <span>{isKu ? 'سەرەوە' : 'Top'}</span>
          </button>
          <button
            onClick={() => onCameraChange('ORBIT')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              cameraMode === 'ORBIT'
                ? 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>{isKu ? '٣ دی' : '3D'}</span>
          </button>
        </div>

        {/* Practice Mode Undo */}
        {showUndo && onUndo && (
          <button
            onClick={onUndo}
            title={t(language, 'undoShot')}
            className="liquid-button px-4 py-3 rounded-2xl flex items-center gap-2 text-sm text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
          >
            <RotateCcw size={16} />
            <span className="hidden md:inline">{isKu ? 'گەڕاندنەوە' : 'Undo'}</span>
          </button>
        )}
      </div>

      {/* Center: Angle & Speed Indicators (from Sophisticated Dark HTML) */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 md:w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-150"
              style={{ width: `${(degrees / 360) * 100}%` }}
            ></div>
          </div>
          <span className="text-[10px] opacity-60 font-mono">
            {isKu ? 'گۆشەی لێدان' : 'ANGLE'}: {degrees}°
          </span>
        </div>

        <div className="h-10 w-px bg-white/10"></div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-20 md:w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${powerPercentage}%` }}
            ></div>
          </div>
          <span className="text-[10px] opacity-60 font-mono">
            {isKu ? 'هێز و خێرایی' : 'POWER'}: {powerPercentage}%
          </span>
        </div>
      </div>

      {/* Right: STRIKE / لێدان Button */}
      <button
        onClick={onShoot}
        disabled={!canShoot}
        className={`bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold py-3.5 md:py-4 px-6 md:px-12 rounded-2xl tracking-[0.15em] uppercase shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all cursor-pointer ${
          !canShoot ? 'opacity-40 cursor-not-allowed filter grayscale' : 'hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'
        }`}
      >
        <span>STRIKE / لێدان</span>
      </button>
    </div>
  );
};
