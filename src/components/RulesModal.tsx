import React from 'react';
import { Language } from '../types/billiards';
import { t } from '../i18n/translations';
import { X, CheckCircle, AlertTriangle, Trophy } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const isKu = language === 'ku';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-card max-w-2xl w-full rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎱</span>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              {t(language, 'rulesTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {isKu ? (
          <div className="space-y-6 text-sm md:text-base text-white/90 leading-relaxed font-sans">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                ١. ئامانجی سەرەکی یارییەکە
              </h3>
              <p>
                یاریزانێک تۆپە ڕەنگاوڕەنگەکان (١-٧) یان خەتدارەکان (٩-١٥) هەڵدەبژێرێت دوای یەکەم تۆپ کە دەخرێتە گیرفانەوە. کاتێک هەموو تۆپەکانی خۆت تەواو کرد، پێویستە لە کۆتاییەکی دروستدا تۆپی ژمارە ٨ (ڕەشەکە) بخەیتە گیرفانەوە بۆ بردنەوە!
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">٢. لێدانی دروست (Legal Shot)</h4>
              <ul className="list-disc list-inside space-y-2 text-white/80 pl-2">
                <li>پێویستە یەکەم بەرکەوتنی تۆپی سپی لەگەڵ تۆپی تیپەکەی خۆت بێت.</li>
                <li>دوای بەرکەوتن، دەبێت لانیکەم یەک تۆپ بەر کەنارەکانی مێزەکە بکەوێت یان بچێتە گیرفانەوە.</li>
                <li>ئەگەر تۆپی سپی بکەوێتە گیرفانەوە، بەرامبەرەکەت مافی "تۆپ لە دەست" (Ball in Hand) وەردەگرێت.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <h3 className="font-bold text-rose-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                ٣. هۆکارەکانی دۆڕاندن (Loss of Game)
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-white/80">
                <li>خستنە گیرفانی تۆپی ژمارە ٨ پێش ئەوەی هەموو تۆپەکانی خۆت تەواو بکەیت.</li>
                <li>کەوتنی تۆپی سپی لە کاتی لێدانی تۆپی ژمارە ٨.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">
                <Trophy size={18} />
                ٤. شێوازی ڕاهێنان (Practice & Trick Shots)
              </h3>
              <p>
                لە شێوازی ڕاهێناندا دەتوانیت هێڵی یارمەتیدەر، گەڕاندنەوەی جووڵە (Undo)، و دانانی ئازادانەی تۆپی سپی تاقی بکەیتەوە.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm md:text-base text-white/90 leading-relaxed font-sans">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                1. Objective of 8-Ball
              </h3>
              <p>
                One player must pocket balls of the group 1 through 7 (Solids), while the other player must pocket balls 9 through 15 (Stripes). The player who pockets either group first and then legally pockets the 8-ball wins the game.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">2. Legal Shot Rules</h4>
              <ul className="list-disc list-inside space-y-2 text-white/80 pl-2">
                <li>The cue ball must strike one of your assigned balls first.</li>
                <li>After contact, at least one ball must hit a cushion rail or drop into a pocket.</li>
                <li>Scratching the cue ball grants your opponent Ball-in-Hand anywhere on the table.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <h3 className="font-bold text-rose-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                3. Instant Loss Conditions
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-white/80">
                <li>Pocketing the 8-Ball before all of your group balls are cleared.</li>
                <li>Scratching the cue ball into a pocket on the same shot that the 8-Ball is pocketed.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all"
          >
            {isKu ? 'تێگەیشتم (داخستن)' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
