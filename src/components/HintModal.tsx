import React from 'react';
import { Lightbulb, X } from 'lucide-react';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  hintText: string;
}

export const HintModal: React.FC<HintModalProps> = ({ isOpen, onClose, hintText }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">보안 탐정 단서 (힌트)</h3>
              <p className="text-xs text-amber-800">게임 중 1회만 제공되는 힌트입니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="py-4 px-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-lg font-medium leading-relaxed">
            "{hintText}"
          </div>
          <p className="mt-4 text-xs text-slate-500">
            사진 속 해당 위치를 꼼꼼히 관찰하고 보안에 취약한 부분을 찾아보세요!
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            확인하고 계속 찾기
          </button>
        </div>
      </div>
    </div>
  );
};
