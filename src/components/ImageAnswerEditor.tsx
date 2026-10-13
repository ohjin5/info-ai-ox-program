import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Plus, Crosshair, AlertCircle } from 'lucide-react';
import type { SecurityAnswer } from '../services/apiService';
import {
  getRenderedImageBounds,
  clientPointToImagePercent,
  type RenderedImageBounds,
} from '../utils/imageCoordinates';
import { AnswerForm } from './AnswerForm';

interface ImageAnswerEditorProps {
  riskImageSrc: string;
  answers: SecurityAnswer[];
  onChangeAnswers: (answers: SecurityAnswer[]) => void;
}

export const ImageAnswerEditor: React.FC<ImageAnswerEditorProps> = ({
  riskImageSrc,
  answers,
  onChangeAnswers,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [bounds, setBounds] = useState<RenderedImageBounds | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(
    answers[0]?.id || null
  );
  const [repositioningId, setRepositioningId] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Update bounds on resize / image load
  const updateBounds = useCallback(() => {
    if (imgRef.current) {
      const b = getRenderedImageBounds(imgRef.current);
      setBounds(b);
    }
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [updateBounds]);

  // Track cursor position for coordinate inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const pt = clientPointToImagePercent(e.clientX, e.clientY, imgRef.current);
    setHoverCoords(pt);
  };

  // Click on risk image preview:
  // If repositioning an existing answer -> updates that answer's (x, y)
  // Else -> creates a new answer at that coordinate!
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const pt = clientPointToImagePercent(e.clientX, e.clientY, imgRef.current);
    if (!pt) return; // Outside rendered image bounds

    if (repositioningId !== null) {
      // Reposition existing answer
      const updated = answers.map((ans) =>
        ans.id === repositioningId ? { ...ans, x: pt.x, y: pt.y } : ans
      );
      onChangeAnswers(updated);
      setSelectedAnswerId(repositioningId);
      setRepositioningId(null);
    } else {
      // Add new answer
      const nextId =
        answers.length > 0 ? Math.max(...answers.map((a) => a.id)) + 1 : 1;
      const newAnswer: SecurityAnswer = {
        id: nextId,
        x: pt.x,
        y: pt.y,
        radius: 8,
        title: `보안 위험 #${answers.length + 1}`,
        hint: '해당 위치 주변을 확인해보세요.',
        explanation: '보안 수칙을 준수하여 안전하게 관리해야 합니다.',
      };
      const updated = [...answers, newAnswer];
      onChangeAnswers(updated);
      setSelectedAnswerId(nextId);
    }
  };

  // Answer modification handlers
  const handleUpdateAnswer = (updatedAnswer: SecurityAnswer) => {
    const updated = answers.map((ans) =>
      ans.id === updatedAnswer.id ? updatedAnswer : ans
    );
    onChangeAnswers(updated);
  };

  const handleDeleteAnswer = (id: number) => {
    const updated = answers.filter((ans) => ans.id !== id);
    onChangeAnswers(updated);
    if (selectedAnswerId === id) {
      setSelectedAnswerId(updated[0]?.id || null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {repositioningId !== null
              ? '이미지에서 이동할 새 위치를 클릭하세요!'
              : '보안 위험 이미지를 클릭하면 새로운 정답 마커(반경 영역)가 생성됩니다.'}
          </span>
        </div>
        <div className="font-mono text-slate-600 font-bold hidden sm:block">
          {hoverCoords ? `X: ${hoverCoords.x}% · Y: ${hoverCoords.y}%` : '좌표: (대기 중)'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className={`relative w-full aspect-3/2 bg-slate-900 rounded-2xl overflow-hidden border-2 shadow-inner select-none cursor-crosshair ${
              repositioningId !== null
                ? 'border-amber-500 ring-2 ring-amber-400/40'
                : 'border-slate-300 hover:border-blue-400'
            }`}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
          >
            <img
              ref={imgRef}
              src={riskImageSrc}
              alt="보안 위험 미리보기"
              className="w-full h-full object-contain pointer-events-none select-none"
              onLoad={updateBounds}
            />

            {/* Rendered Bounds Overlay for Markers */}
            {bounds && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${bounds.offsetX}px`,
                  top: `${bounds.offsetY}px`,
                  width: `${bounds.renderedWidth}px`,
                  height: `${bounds.renderedHeight}px`,
                }}
              >
                {answers.map((ans, idx) => {
                  const isSelected = selectedAnswerId === ans.id;
                  const isRepo = repositioningId === ans.id;

                  return (
                    <div
                      key={ans.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all select-none"
                      style={{
                        left: `${ans.x}%`,
                        top: `${ans.y}%`,
                        width: `${ans.radius * 2}%`,
                        height: `${ans.radius * 2 * (bounds.renderedWidth / bounds.renderedHeight)}%`,
                      }}
                    >
                      {/* Semi-transparent Circular Hitbox Radius Indicator */}
                      <div
                        className={`w-full h-full rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-500/30 border-blue-600 shadow-md ring-2 ring-blue-400/50'
                            : 'bg-emerald-500/20 border-emerald-500'
                        } ${isRepo ? 'animate-ping' : ''}`}
                      >
                        {/* Center Number badge */}
                        <div
                          className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center text-white shadow ${
                            isSelected ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </div>

                      {/* Small coordinate chip */}
                      <div className="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[9px] shadow pointer-events-none">
                        ({ans.x}%, {ans.y}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-full mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>총 등록된 정답: <strong className="text-slate-800">{answers.length}개</strong></span>
            <span>반경(원 크기)은 우측 슬라이더로 조절할 수 있습니다</span>
          </div>
        </div>

        {/* Right: Answer List & Forms (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">정답 세부 설정</h3>
            <span className="text-xs text-slate-500">최소 1개 이상 권장</span>
          </div>

          {answers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                아직 등록된 정답이 없습니다.
              </p>
              <p className="text-[11px] text-slate-400">
                왼쪽 이미지를 클릭하여 보안 위험 지점을 추가하세요.
              </p>
            </div>
          ) : (
            answers.map((ans, idx) => (
              <AnswerForm
                key={ans.id}
                answer={ans}
                index={idx}
                isSelected={selectedAnswerId === ans.id}
                isRepositioning={repositioningId === ans.id}
                onSelect={() => {
                  setSelectedAnswerId(ans.id);
                  setRepositioningId(null);
                }}
                onUpdate={handleUpdateAnswer}
                onDelete={() => handleDeleteAnswer(ans.id)}
                onStartReposition={() => {
                  setSelectedAnswerId(ans.id);
                  setRepositioningId(ans.id);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
