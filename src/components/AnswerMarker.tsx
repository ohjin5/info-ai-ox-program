import React from 'react';
import { Check } from 'lucide-react';
import type { SecurityAnswer } from '../data/securityGameData';

interface AnswerMarkerProps {
  answer: SecurityAnswer;
  isRecent?: boolean;
}

export const AnswerMarker: React.FC<AnswerMarkerProps> = ({ answer, isRecent }) => {
  return (
    <div
      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 select-none z-20"
      style={{
        left: `${answer.x}%`,
        top: `${answer.y}%`,
      }}
      aria-label={`발견한 보안 위험: ${answer.title}`}
    >
      {/* Outer pulsing beacon ring */}
      <div className={`absolute -inset-3 rounded-full border-2 border-emerald-400 opacity-75 ${isRecent ? 'animate-ping' : ''}`} />

      {/* Target circle indicating hit area */}
      <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/25 border-2 border-emerald-500 shadow-lg shadow-emerald-900/30 backdrop-blur-xs">
        <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-emerald-600 text-white font-bold shadow-md">
          <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[3]" />
        </div>
      </div>

      {/* Item title pill floating above/below marker */}
      <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/90 text-white text-[11px] font-medium tracking-tight shadow-md border border-slate-700 pointer-events-none">
        {answer.title}
      </div>
    </div>
  );
};

interface WrongClickMarkerProps {
  x: number;
  y: number;
}

export const WrongClickMarker: React.FC<WrongClickMarkerProps> = ({ x, y }) => {
  return (
    <div
      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 select-none z-30 transition-opacity duration-300"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/30 border-2 border-rose-500 shadow-lg animate-scale-in">
        <span className="text-rose-600 text-lg font-black leading-none drop-shadow">✕</span>
      </div>
      <div className="absolute left-1/2 -top-6 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-rose-900/90 text-rose-100 text-[10px] font-bold shadow">
        다시 찾아보세요!
      </div>
    </div>
  );
};
