import React from 'react';
import { Award, AlertTriangle, RotateCcw, Heart, Clock, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import type { SecurityAnswer } from '../services/apiService';
import { DEFAULT_CONFIG } from '../constants/config';

interface ResultScreenProps {
  isSuccess: boolean;
  foundAnswers: SecurityAnswer[];
  allAnswers: SecurityAnswer[];
  livesLeft: number;
  maxLives: number;
  timeSpent: number;
  failReason: 'TIME_OUT' | 'NO_LIVES' | null;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  isSuccess,
  foundAnswers,
  allAnswers,
  livesLeft,
  maxLives,
  timeSpent,
  failReason,
  onRestart,
}) => {
  const unfoundAnswers = allAnswers.filter(
    (ans) => !foundAnswers.some((fa) => fa.id === ans.id)
  );

  return (
    <div className="w-full max-w-3xl mx-auto my-auto p-4 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Banner */}
        <div
          className={`p-8 sm:p-10 text-center relative overflow-hidden ${
            isSuccess
              ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-900/50'
              : 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/50'
          }`}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {isSuccess ? (
                <Award className="w-10 h-10 sm:w-12 sm:h-12" />
              ) : (
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
            </div>

            <h2
              className="font-black tracking-tight mb-2"
              style={{ fontSize: 'clamp(26px, 2.4vw, 44px)' }}
            >
              {isSuccess ? '보안 탐정 성공!' : '아쉽습니다!'}
            </h2>

            <p
              className="text-slate-300 max-w-md mx-auto"
              style={{ fontSize: 'clamp(15px, 1.1vw, 20px)' }}
            >
              {isSuccess
                ? '숨겨진 보안 위험 요소를 모두 성공적으로 찾아냈습니다!'
                : failReason === 'TIME_OUT'
                ? '제한시간이 초과되었습니다. 보안 위험을 다시 한번 확인해보세요.'
                : '보안 위험을 다시 한번 확인해보세요.'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">찾은 보안 위험</div>
              <div
                className="font-black text-emerald-400 tabular-nums"
                style={{ fontSize: 'clamp(20px, 1.8vw, 32px)' }}
              >
                {foundAnswers.length}
                <span className="text-sm sm:text-base font-normal text-slate-400"> / {allAnswers.length}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">남은 목숨</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      i < livesLeft
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-slate-700 fill-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">소요 시간</div>
              <div
                className="font-black text-white tabular-nums flex items-center justify-center gap-1.5"
                style={{ fontSize: 'clamp(20px, 1.8vw, 32px)' }}
              >
                <Clock className="w-5 h-5 text-slate-400" />
                <span>{timeSpent}초</span>
              </div>
            </div>
          </div>

          {/* Educational Findings Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>병원 정보보호 핵심 체크리스트</span>
            </h3>

            <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
              {allAnswers.map((item) => {
                const wasFound = foundAnswers.some((fa) => fa.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm ${
                      wasFound
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-bold text-white">
                        {wasFound ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{item.title}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          wasFound
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {wasFound ? '발견 완료' : '미발견'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slogan */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/60 text-center">
            <p className="text-sm sm:text-base font-semibold text-blue-300">
              "{DEFAULT_CONFIG.campaignSlogan}"
            </p>
          </div>

          {/* Restart Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onRestart}
              className="w-full max-w-sm py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontSize: 'clamp(16px, 1.1vw, 22px)' }}
            >
              <RotateCcw className="w-5 h-5" />
              <span>다시 도전하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
