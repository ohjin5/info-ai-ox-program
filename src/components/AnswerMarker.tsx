import React from 'react';

import {
  Check,
  X,
} from 'lucide-react';

import type {
  SecurityAnswer,
} from '../services/apiService';


interface AnswerMarkerProps {
  answer: SecurityAnswer;

  isRecent?: boolean;
}


export const AnswerMarker:
React.FC<AnswerMarkerProps> = ({
  answer,
  isRecent,
}) => {

  return (

    <div
      className="
        absolute
        pointer-events-none
        -translate-x-1/2
        -translate-y-1/2
        select-none
        z-20
      "
      style={{
        left:
          `${answer.x}%`,

        top:
          `${answer.y}%`,
      }}
      aria-label={
        `발견한 보안 위험: ${answer.title}`
      }
    >

      {/* =====================================================
          외곽 강조 링
      ===================================================== */}

      <div
        className={`
          absolute
          -inset-3
          rounded-full
          border-2
          border-emerald-400
          bg-emerald-200/10
          ${
            isRecent
              ? 'animate-ping'
              : ''
          }
        `}
      />


      {/* =====================================================
          정답 마커
      ===================================================== */}

      <div
        className="
          relative
          flex
          items-center
          justify-center
          w-10
          h-10
          md:w-12
          md:h-12
          rounded-full
          bg-white/90
          border-2
          border-emerald-400
          shadow-lg
          shadow-emerald-200/70
          backdrop-blur-sm
        "
      >

        <div
          className="
            flex
            items-center
            justify-center
            w-6
            h-6
            md:w-7
            md:h-7
            rounded-full
            bg-emerald-500
            text-white
            shadow-sm
          "
        >

          <Check
            className="
              w-4
              h-4
              md:w-5
              md:h-5
              stroke-[3]
            "
          />

        </div>

      </div>


      {/* =====================================================
          정답 제목
      ===================================================== */}

      <div
        className="
          absolute
          left-1/2
          -bottom-8
          -translate-x-1/2
          whitespace-nowrap
          px-2.5
          py-1
          rounded-lg
          bg-white/95
          text-emerald-700
          text-[11px]
          font-bold
          tracking-tight
          shadow-md
          shadow-emerald-100/70
          border
          border-emerald-200
          backdrop-blur-sm
          pointer-events-none
        "
      >
        {answer.title}
      </div>

    </div>
  );
};


interface WrongClickMarkerProps {
  x: number;

  y: number;
}


export const WrongClickMarker:
React.FC<WrongClickMarkerProps> = ({
  x,
  y,
}) => {

  return (

    <div
      className="
        absolute
        pointer-events-none
        -translate-x-1/2
        -translate-y-1/2
        select-none
        z-30
        transition-opacity
        duration-300
      "
      style={{
        left:
          `${x}%`,

        top:
          `${y}%`,
      }}
    >

      {/* =====================================================
          오답 마커
      ===================================================== */}

      <div
        className="
          relative
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-full
          bg-white/95
          border-2
          border-rose-400
          shadow-lg
          shadow-rose-200/70
          animate-scale-in
        "
      >

        <div
          className="
            flex
            items-center
            justify-center
            w-6
            h-6
            rounded-full
            bg-rose-100
            text-rose-600
          "
        >

          <X
            className="
              w-4
              h-4
              stroke-[3]
            "
          />

        </div>

      </div>


      {/* =====================================================
          오답 안내 문구
      ===================================================== */}

      <div
        className="
          absolute
          left-1/2
          -top-8
          -translate-x-1/2
          whitespace-nowrap
          px-2.5
          py-1
          rounded-lg
          bg-white/95
          text-rose-600
          text-[10px]
          sm:text-[11px]
          font-bold
          shadow-md
          shadow-rose-100/70
          border
          border-rose-200
          backdrop-blur-sm
        "
      >
        다시 찾아보세요!
      </div>

    </div>
  );
};