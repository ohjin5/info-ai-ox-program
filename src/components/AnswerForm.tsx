import React from 'react';
import { Trash2, Crosshair } from 'lucide-react';
import type { SecurityAnswer } from '../services/apiService';

interface AnswerFormProps {
  answer: SecurityAnswer;
  index: number;
  isSelected: boolean;
  isRepositioning: boolean;
  onSelect: () => void;
  onUpdate: (updated: SecurityAnswer) => void;
  onDelete: () => void;
  onStartReposition: () => void;
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
  answer,
  index,
  isSelected,
  isRepositioning,
  onSelect,
  onUpdate,
  onDelete,
  onStartReposition,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header: Answer Number & Delete button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-slate-900">
            {answer.title || `정답 #${index + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onStartReposition}
            title="위치 다시 지정하기"
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isRepositioning
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isRepositioning ? '이미지 클릭 중...' : '위치 재지정'}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="정답 삭제"
            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <div>
          <label className="text-[11px] font-bold text-slate-600">정답 제목</label>
          <input
            type="text"
            value={answer.title}
            onChange={(e) => onUpdate({ ...answer, title: e.target.value })}
            placeholder="예: 환자정보 화면 노출"
            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Coordinates (X, Y) and Radius */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-600">X 좌표 (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={answer.x}
              onChange={(e) => onUpdate({ ...answer, x: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600">Y 좌표 (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={answer.y}
              onChange={(e) => onUpdate({ ...answer, y: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-600">반경 (Radius)</label>
              <span className="text-[10px] font-bold text-blue-600">{answer.radius}%</span>
            </div>
            <input
              type="range"
              min="4"
              max="15"
              step="0.5"
              value={answer.radius}
              onChange={(e) => onUpdate({ ...answer, radius: parseFloat(e.target.value) || 8 })}
              className="w-full mt-2 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Hint */}
        <div>
          <label className="text-[11px] font-bold text-slate-600">힌트 내용</label>
          <input
            type="text"
            value={answer.hint}
            onChange={(e) => onUpdate({ ...answer, hint: e.target.value })}
            placeholder="예: 가운데 업무용 PC 화면을 확인해보세요."
            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Explanation */}
        <div>
          <label className="text-[11px] font-bold text-slate-600">정답 설명 (교육용 메시지)</label>
          <textarea
            rows={2}
            value={answer.explanation}
            onChange={(e) => onUpdate({ ...answer, explanation: e.target.value })}
            placeholder="예: 업무용 PC 모니터에 환자 개인정보가 노출되어 있습니다..."
            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
