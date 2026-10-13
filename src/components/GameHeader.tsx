import React from 'react';
import { Clock, Heart, Lightbulb, Volume2, VolumeX, Shield, Code } from 'lucide-react';
import { GAME_CONFIG } from '../data/securityGameData';

interface GameHeaderProps {
  timeLeft: number;
  lives: number;
  maxLives: number;
  foundCount: number;
  totalAnswers: number;
  hintUsed: boolean;
  onUseHint: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  devMode: boolean;
  onToggleDevMode: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  timeLeft,
  lives,
  maxLives,
  foundCount,
  totalAnswers,
  hintUsed,
  onUseHint,
  isMuted,
  onToggleSound,
  devMode,
  onToggleDevMode,
}) => {
  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white shadow-md select-none sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top bar with Hospital Campaign Brand & Controls */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white shadow-xs">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white tracking-tight">{GAME_CONFIG.title}</span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-400 hidden sm:inline">{GAME_CONFIG.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dev Mode toggle button */}
            <button
              type="button"
              onClick={onToggleDevMode}
              title={devMode ? "개발자 좌표 모드 켜짐" : "개발자 좌표 모드 끄기"}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                devMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">DEV {devMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Mute button */}
            <button
              type="button"
              onClick={onToggleSound}
              title={isMuted ? "소리 켜기" : "소리 끄기"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isMuted ? "소리 켜기" : "소리 끄기"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Primary HUD Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
          {/* 1. Timer */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
              isUrgent
                ? 'bg-rose-950/70 border-rose-500/80 text-rose-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400">
              <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400' : 'text-blue-400'}`} />
              <span className="hidden sm:inline">남은 시간</span>
            </div>
            <span className={`font-mono font-bold text-sm sm:text-base tabular-nums ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
              {timeFormatted}
            </span>
          </div>

          {/* 2. Lives */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] sm:text-xs text-slate-400 hidden sm:inline">목숨</span>
            <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`남은 목숨 ${lives}개`}>
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                    i < lives
                      ? 'text-rose-500 fill-rose-500 scale-100 drop-shadow'
                      : 'text-slate-600 fill-slate-700/40 scale-90'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3. Found Count */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] sm:text-xs text-slate-400 hidden sm:inline">찾은 위험</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm sm:text-base text-emerald-400 tabular-nums">
                {foundCount}
              </span>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-xs sm:text-sm text-slate-400 tabular-nums">
                {totalAnswers}
              </span>
            </div>
          </div>

          {/* 4. Hint Button */}
          <button
            type="button"
            onClick={onUseHint}
            disabled={hintUsed || foundCount === totalAnswers}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              hintUsed || foundCount === totalAnswers
                ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-98 cursor-pointer shadow-sm'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hintUsed ? 'text-slate-500' : 'text-amber-400 fill-amber-400/60'}`} />
            <span className="whitespace-nowrap">
              {hintUsed ? '힌트 완료' : '💡 힌트 1'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
