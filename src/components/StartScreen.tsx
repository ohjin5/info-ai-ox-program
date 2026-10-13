import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, Heart, Lightbulb, Play, AlertCircle, Settings } from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants/config';

interface StartScreenProps {
  gameTitle?: string;
  totalRisksCount: number;
  timeLimit: number;
  lives: number;
  hintCount: number;
  onStart: () => void;
  isLoadingImages: boolean;
  imageLoadError: boolean;
  onRetryImageLoad: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  gameTitle = DEFAULT_CONFIG.gameTitle,
  totalRisksCount,
  timeLimit,
  lives,
  hintCount,
  onStart,
  isLoadingImages,
  imageLoadError,
  onRetryImageLoad,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto my-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative">
      {/* Discrete Admin Link at Top-Right */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
        <Link
          to="/admin"
          title="관리자 설정으로 이동"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors backdrop-blur-xs"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>⚙ 관리자</span>
        </Link>
      </div>

      <div className="bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white">
        {/* Banner */}
        <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-slate-900 via-blue-950/60 to-slate-900 border-b border-slate-800 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs sm:text-sm font-semibold mb-4">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>병원 정보보호 실천 캠페인</span>
          </div>

          <h1
            className="font-black tracking-tight text-white mb-4 text-balance"
            style={{ fontSize: 'clamp(28px, 2.8vw, 54px)' }}
          >
            {gameTitle}
          </h1>

          <p
            className="text-slate-300 max-w-xl mx-auto font-medium leading-relaxed text-balance"
            style={{ fontSize: 'clamp(16px, 1.3vw, 24px)' }}
          >
            두 사진을 비교하여 보안 위험이 있는 부분을 찾아보세요.
          </p>

          <div
            className="mt-3 font-bold text-emerald-400"
            style={{ fontSize: 'clamp(18px, 1.4vw, 26px)' }}
          >
            숨겨진 보안 위험 {totalRisksCount}개를 모두 찾아보세요!
          </div>
        </div>

        {/* Rules Cards */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">제한 시간</div>
                <div className="text-lg sm:text-xl font-bold text-white">{timeLimit}초</div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <Heart className="w-6 h-6 fill-rose-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">기회 (목숨)</div>
                <div className="text-lg sm:text-xl font-bold text-white">{lives}개</div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Lightbulb className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">단서 (힌트)</div>
                <div className="text-lg sm:text-xl font-bold text-white">{hintCount}회 제공</div>
              </div>
            </div>
          </div>

          {/* Action / Preload */}
          {imageLoadError ? (
            <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>이미지를 불러올 수 없습니다.</span>
              </div>
              <p className="text-xs text-rose-400">
                네트워크 연결을 확인하거나 다시 시도해주세요.
              </p>
              <button
                type="button"
                onClick={onRetryImageLoad}
                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer text-sm"
              >
                다시 불러오기
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStart}
                disabled={isLoadingImages}
                className={`w-full max-w-md py-4 px-8 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  isLoadingImages
                    ? 'bg-slate-700 cursor-wait text-slate-300'
                    : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02]'
                }`}
                style={{ fontSize: 'clamp(18px, 1.3vw, 24px)' }}
              >
                {isLoadingImages ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>이미지 로딩 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>게임 시작</span>
                  </>
                )}
              </button>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {DEFAULT_CONFIG.campaignSlogan}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
