import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Eye } from 'lucide-react';
import type { SecurityAnswer } from '../data/securityGameData';
import { AnswerMarker, WrongClickMarker } from './AnswerMarker';

interface ComparisonImagesProps {
  normalImagePath: string;
  riskImagePath: string;
  answers: SecurityAnswer[];
  foundAnswerIds: number[];
  onCorrectAnswer: (answer: SecurityAnswer) => void;
  onWrongClick: (coords: { x: number; y: number }) => void;
  activeExplanation: { title: string; text: string } | null;
  devMode: boolean;
  isGameOver: boolean;
}

export const ComparisonImages: React.FC<ComparisonImagesProps> = ({
  normalImagePath,
  riskImagePath,
  answers,
  foundAnswerIds,
  onCorrectAnswer,
  onWrongClick,
  activeExplanation,
  devMode,
  isGameOver,
}) => {
  const riskImageRef = useRef<HTMLImageElement>(null);
  const clickLockRef = useRef<boolean>(false);

  // Temporary wrong click marker
  const [wrongClick, setWrongClick] = useState<{ x: number; y: number } | null>(null);

  // Dev mode last clicked coordinate display
  const [lastDevCoords, setLastDevCoords] = useState<{ x: number; y: number } | null>(null);

  // Mobile view mode toggle ('side-by-side' or 'tabs' for ultra-small screens)
  const [mobileTab, setMobileTab] = useState<'both' | 'normal' | 'risk'>('both');

  // Detect mobile screen for adaptive radius
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click on the RIGHT (security-risk) image
  const handleRiskImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isGameOver) return;
    if (clickLockRef.current) return;

    const img = riskImageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Check if the click is within the actual rendered image boundaries
    const clientX = event.clientX;
    const clientY = event.clientY;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return;
    }

    const clickX = ((clientX - rect.left) / rect.width) * 100;
    const clickY = ((clientY - rect.top) / rect.height) * 100;

    // Dev mode logging
    if (devMode) {
      console.log('Clicked position:', {
        x: Number(clickX.toFixed(1)),
        y: Number(clickY.toFixed(1)),
      });
      setLastDevCoords({ x: Number(clickX.toFixed(1)), y: Number(clickY.toFixed(1)) });
    }

    // Hit detection against all answers
    let matchedAnswer: SecurityAnswer | null = null;

    for (const ans of answers) {
      const radius = isMobile && ans.mobileRadius ? ans.mobileRadius : ans.radius;
      const distance = Math.sqrt(
        Math.pow(clickX - ans.x, 2) + Math.pow(clickY - ans.y, 2)
      );

      if (distance <= radius) {
        matchedAnswer = ans;
        break;
      }
    }

    if (matchedAnswer) {
      // Check if already found
      if (foundAnswerIds.includes(matchedAnswer.id)) {
        // Already found: do nothing, do not penalize, do not double-score
        return;
      }

      // Newly found correct answer!
      onCorrectAnswer(matchedAnswer);
    } else {
      // Wrong click
      // Lock clicks for ~500ms debounce
      clickLockRef.current = true;
      setWrongClick({ x: clickX, y: clickY });
      onWrongClick({ x: clickX, y: clickY });

      // Dismiss wrong marker after 500ms
      setTimeout(() => {
        setWrongClick(null);
        clickLockRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mobile Tab Control for very narrow viewports */}
      <div className="w-full md:hidden flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-xs text-slate-500 font-medium">보기 모드:</span>
        <div className="inline-flex rounded-lg p-0.5 bg-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('both')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            나란히 비교
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('normal')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            정상
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('risk')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'risk' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            위험(클릭)
          </button>
        </div>
      </div>

      {/* Dev Mode Floating Coordinate Overlay */}
      {devMode && (
        <div className="w-full max-w-7xl px-4 py-1.5 bg-amber-500/15 border-b border-amber-300 text-amber-900 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">DEV MODE ACTIVE</span>
            <span>클릭한 좌표: {lastDevCoords ? `X: ${lastDevCoords.x}% · Y: ${lastDevCoords.y}%` : '오른쪽 이미지를 클릭하세요'}</span>
          </div>
          <span className="text-[11px] text-amber-700">모바일 반경: {isMobile ? '10%' : '8%'}</span>
        </div>
      )}

      {/* Main Image Comparison Arena */}
      <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start">
        {/* ========================================= */}
        {/* LEFT: NORMAL IMAGE (보안상 정상)         */}
        {/* ========================================= */}
        <div
          className={`flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${
            mobileTab === 'risk' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800 text-sm">정상 모습 (기준 사진)</span>
            </div>
            <span className="text-xs text-slate-500">참고용 이미지</span>
          </div>

          {/* Image Container */}
          <div className="relative w-full aspect-3/2 bg-slate-900/5 flex items-center justify-center overflow-hidden select-none">
            <img
              src={normalImagePath}
              alt="정상 간호사 스테이션 모습"
              className="w-full h-full object-contain pointer-events-none select-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          </div>
          <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 text-center">
            보안 수칙이 안전하게 준수된 정상 상태입니다.
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT: RISK IMAGE (보안 위험 포함 - CLICKABLE) */}
        {/* ========================================= */}
        <div
          className={`flex flex-col bg-white rounded-2xl shadow-md border-2 border-blue-500/30 ring-2 ring-blue-500/10 overflow-hidden ${
            mobileTab === 'normal' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-blue-950 text-sm">보안 위험이 있는 모습</span>
            </div>
            <span className="text-xs font-semibold text-blue-600 animate-pulse">
              👉 여기를 클릭해서 찾으세요!
            </span>
          </div>

          {/* Interactive Clickable Area */}
          <div
            className="relative w-full aspect-3/2 bg-slate-900/5 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
            onClick={handleRiskImageClick}
          >
            <img
              ref={riskImageRef}
              src={riskImagePath}
              alt="보안 위험이 포함된 간호사 스테이션 모습"
              className="w-full h-full object-contain pointer-events-none select-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />

            {/* Found Answer Markers */}
            {answers
              .filter((ans) => foundAnswerIds.includes(ans.id))
              .map((ans) => (
                <AnswerMarker key={ans.id} answer={ans} />
              ))}

            {/* Wrong Click Temporary Marker */}
            {wrongClick && (
              <WrongClickMarker x={wrongClick.x} y={wrongClick.y} />
            )}

            {/* Dev Mode Visual Target Outlines */}
            {devMode && (
              <>
                {answers.map((ans) => {
                  const radius = isMobile && ans.mobileRadius ? ans.mobileRadius : ans.radius;
                  const isFound = foundAnswerIds.includes(ans.id);
                  return (
                    <div
                      key={`dev-${ans.id}`}
                      className="absolute pointer-events-none rounded-full border border-dashed border-amber-400 bg-amber-400/20 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{
                        left: `${ans.x}%`,
                        top: `${ans.y}%`,
                        width: `${radius * 2}%`,
                        height: `${radius * 2 * 1.5}%`, // approximate aspect adjustment
                      }}
                    >
                      <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-200/90 px-1 rounded">
                        #{ans.id} ({ans.x}%, {ans.y}%) {isFound ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="px-4 py-2 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              남은 보안 위험: <strong className="text-blue-700">{answers.length - foundAnswerIds.length}개</strong>
            </span>
            <span className="text-slate-500">정답을 찾으면 녹색 체크로 표시됩니다</span>
          </div>
        </div>
      </div>

      {/* Real-time Educational Explanation Toast Banner */}
      {activeExplanation && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-xl animate-slide-up">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">정답입니다!</span>
                <span className="text-sm font-bold text-white truncate">{activeExplanation.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activeExplanation.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
