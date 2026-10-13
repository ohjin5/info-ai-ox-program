import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { SecurityAnswer } from '../services/apiService';
import {
  getRenderedImageBounds,
  clientPointToImagePercent,
  type RenderedImageBounds,
} from '../utils/imageCoordinates';
import { AnswerMarker, WrongClickMarker } from './AnswerMarker';

interface ImageComparisonProps {
  normalImageUrl: string;
  riskImageUrl: string;
  answers: SecurityAnswer[];
  foundAnswerIds: number[];
  onCorrectAnswer: (answer: SecurityAnswer) => void;
  onWrongClick: () => void;
  activeExplanation: { title: string; text: string } | null;
  isGameOver: boolean;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  normalImageUrl,
  riskImageUrl,
  answers,
  foundAnswerIds,
  onCorrectAnswer,
  onWrongClick,
  activeExplanation,
  isGameOver,
}) => {
  const riskImgRef = useRef<HTMLImageElement>(null);
  const clickLockRef = useRef<boolean>(false);

  // Exact bounds of the rendered image within the object-fit contain element
  const [riskBounds, setRiskBounds] = useState<RenderedImageBounds | null>(null);

  // Temporary wrong click marker percentage coordinates
  const [wrongClickPoint, setWrongClickPoint] = useState<{ x: number; y: number } | null>(null);

  // Update bounds on window resize or image load
  const updateRiskBounds = useCallback(() => {
    if (riskImgRef.current) {
      const bounds = getRenderedImageBounds(riskImgRef.current);
      setRiskBounds(bounds);
    }
  }, []);

  useEffect(() => {
    updateRiskBounds();
    window.addEventListener('resize', updateRiskBounds);
    return () => window.removeEventListener('resize', updateRiskBounds);
  }, [updateRiskBounds]);

  // Click handler on the right (risk) image
  const handleRiskClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGameOver || clickLockRef.current) return;

    const img = riskImgRef.current;
    if (!img) return;

    // Calculate percentage point (0 - 100) within the actual rendered image
    const point = clientPointToImagePercent(e.clientX, e.clientY, img);

    // If clicked on letterbox/pillarbox outside the photo, do nothing
    if (!point) return;

    const { x: clickX, y: clickY } = point;

    // Check hit against answers
    let matchedAnswer: SecurityAnswer | null = null;

    for (const ans of answers) {
      const dx = clickX - ans.x;
      const dy = clickY - ans.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= ans.radius) {
        matchedAnswer = ans;
        break;
      }
    }

    if (matchedAnswer) {
      // Check if already found
      if (foundAnswerIds.includes(matchedAnswer.id)) {
        return; // Already found: do not penalize or double count
      }
      onCorrectAnswer(matchedAnswer);
    } else {
      // Wrong click
      clickLockRef.current = true;
      setWrongClickPoint({ x: clickX, y: clickY });
      onWrongClick();

      setTimeout(() => {
        setWrongClickPoint(null);
        clickLockRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center px-2 sm:px-4 md:px-6 py-2 overflow-hidden relative">
      {/* 
        Wide Comparison Arena:
        - 95% ~ 98% of total viewport width
        - Height takes 78% ~ 82% of screen height on TV/desktop
        - 2 columns 50:50 grid with tight clamp gap
        - No narrow max-width restrictions
      */}
      <div
        className="w-[98%] max-w-[2600px] h-[78vh] sm:h-[80vh] lg:h-[82vh] grid grid-cols-1 md:grid-cols-2 items-center justify-center"
        style={{
          gap: 'clamp(8px, 1.2vw, 22px)',
        }}
      >
        {/* Left: Normal Image Panel (object-fit: contain, full panel) */}
        <div className="relative w-full h-full rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-2xl min-w-0">
          <img
            src={normalImageUrl}
            alt="정상 이미지"
            className="w-full h-full max-h-[82vh] object-contain pointer-events-none select-none"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        </div>

        {/* Right: Risk Image Panel (Clickable, object-fit: contain, full panel) */}
        <div
          className="relative w-full h-full rounded-2xl bg-slate-900/40 border-2 border-slate-700/80 hover:border-blue-500/60 transition-colors overflow-hidden flex items-center justify-center shadow-2xl cursor-crosshair select-none min-w-0"
          onClick={handleRiskClick}
        >
          <img
            ref={riskImgRef}
            src={riskImageUrl}
            alt="보안 위험 이미지"
            className="w-full h-full max-h-[82vh] object-contain pointer-events-none select-none"
            referrerPolicy="no-referrer"
            draggable={false}
            onLoad={updateRiskBounds}
          />

          {/* Exact overlay matching the rendered image boundaries inside object-fit */}
          {riskBounds && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${riskBounds.offsetX}px`,
                top: `${riskBounds.offsetY}px`,
                width: `${riskBounds.renderedWidth}px`,
                height: `${riskBounds.renderedHeight}px`,
              }}
            >
              {/* Found Answer Markers */}
              {answers
                .filter((ans) => foundAnswerIds.includes(ans.id))
                .map((ans) => (
                  <AnswerMarker key={ans.id} answer={ans} />
                ))}

              {/* Wrong Click Animated Marker */}
              {wrongClickPoint && (
                <WrongClickMarker x={wrongClickPoint.x} y={wrongClickPoint.y} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Educational Explanation Toast (2~3 seconds) */}
      {activeExplanation && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-2xl animate-slide-up pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-emerald-500/60 flex items-start gap-3.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider">정답입니다!</span>
                <span className="text-sm sm:text-base font-bold text-white truncate">{activeExplanation.title}</span>
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
