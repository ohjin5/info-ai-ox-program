import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Lightbulb, Volume2, VolumeX, Shield, Settings } from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants/config';

interface GameHUDProps {
  gameTitle?: string;
  timeLeft: number;
  lives: number;
  maxLives: number;
  foundCount: number;
  totalAnswers: number;
  hintCount: number;
  onUseHint: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameTitle = DEFAULT_CONFIG.gameTitle,
  timeLeft,
  lives,
  maxLives,
  foundCount,
  totalAnswers,
  hintCount,
  onUseHint,
  isMuted,
  onToggleSound,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800 text-white select-none px-3 sm:px-6 py-2 shrink-0 z-40 backdrop-blur-md">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Title Brand Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white shadow-xs">
            <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span
            className="font-black text-white tracking-tight truncate hidden md:inline"
            style={{ fontSize: 'clamp(15px, 1.1vw, 22px)' }}
          >
            {gameTitle}
          </span>
        </div>

        {/* Zone 2: Central Game Status Controls (Timer, Lives, Found, Hint) */}
        <div className="flex items-center gap-2.5 sm:gap-6 md:gap-8 shrink-0">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border transition-all ${
              isUrgent
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/30'
                : 'bg-slate-900 border-slate-700/80 text-slate-100'
            }`}
          >
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isUrgent ? 'text-rose-400' : 'text-blue-400'}`} />
            <span
              className={`font-mono font-black tabular-nums tracking-wider ${isUrgent ? 'text-rose-400' : 'text-white'}`}
              style={{ fontSize: 'clamp(16px, 1.2vw, 24px)' }}
            >
              {timeFormatted}
            </span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1" aria-label={`남은 목숨 ${lives}개`}>
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                    i < lives
                      ? 'text-rose-500 fill-rose-500 scale-100 drop-shadow'
                      : 'text-slate-700 fill-slate-800 scale-90'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Found Count */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span
              className="font-black text-emerald-400 tabular-nums"
              style={{ fontSize: 'clamp(16px, 1.2vw, 24px)' }}
            >
              {foundCount}
            </span>
            <span className="text-slate-500 text-sm sm:text-base font-bold">/</span>
            <span
              className="font-bold text-slate-300 tabular-nums"
              style={{ fontSize: 'clamp(14px, 1vw, 20px)' }}
            >
              {totalAnswers}
            </span>
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={onUseHint}
            disabled={hintCount <= 0 || foundCount === totalAnswers}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl font-bold transition-all ${
              hintCount <= 0 || foundCount === totalAnswers
                ? 'bg-slate-900/60 text-slate-500 border border-slate-800/80 cursor-not-allowed'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-98 shadow-sm cursor-pointer'
            }`}
            style={{ fontSize: 'clamp(12px, 0.9vw, 16px)' }}
          >
            <Lightbulb className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hintCount <= 0 ? 'text-slate-500' : 'text-amber-400 fill-amber-400/50'}`} />
            <span className="whitespace-nowrap">
              {hintCount <= 0 ? '힌트 사용완료' : '💡 힌트'}
            </span>
          </button>
        </div>

        {/* Zone 3: Quiet Utilities (Mute & Admin Button) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Discrete Admin Link (Subtle gray/navy, not distracting for participants) */}
          <Link
            to="/admin"
            title="관리자 설정으로 이동"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800/90 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="whitespace-nowrap">⚙ 관리자</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
