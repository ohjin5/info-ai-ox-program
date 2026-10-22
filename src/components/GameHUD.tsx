import React from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  Clock3,
  Lightbulb,
  Volume2,
  VolumeX,
  ShieldCheck,
  Settings,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';

import {
  DEFAULT_CONFIG,
} from '../constants/config';


interface GameHUDProps {
  gameTitle?: string;

  timeLeft: number;

  lives: number;

  maxLives: number;

  /*
   * 새 게임에서는
   * 완전히 해결한 문제 수
   *
   * 위치 + 4지선다까지 맞혀야 증가
   */
  foundCount: number;

  /*
   * 이번 게임 전체 문제 수
   *
   * 기본 3
   */
  totalAnswers: number;

  hintCount: number;

  onUseHint: () => void;

  isMuted: boolean;

  onToggleSound: () => void;
}


export const GameHUD:
React.FC<GameHUDProps> = ({

  gameTitle =
    DEFAULT_CONFIG.gameTitle,

  timeLeft,

  lives,

  maxLives,

  foundCount,

  totalAnswers,

  hintCount,

  onUseHint,

  isMuted,

  onToggleSound,

}) => {

  /* =========================================================
     시간
  ========================================================= */

  const minutes =
    Math.floor(
      timeLeft / 60
    );


  const seconds =
    timeLeft % 60;


  const timeFormatted =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;


  const isUrgent =
    timeLeft <= 10 &&
    timeLeft > 0;


  /* =========================================================
     Hint
  ========================================================= */

  const isAllCompleted =
    foundCount >=
    totalAnswers;


  const isHintDisabled =
    hintCount <= 0 ||
    isAllCompleted;


  /* =========================================================
     기회 상태
  ========================================================= */

  const isLifeDanger =
    lives <= 1;


  /* =========================================================
     Render
  ========================================================= */

  return (

    <header
      className="
        w-full
        bg-white/95
        border-b
        border-sky-100
        text-slate-800
        select-none
        px-3
        sm:px-5
        lg:px-6
        py-2.5
        shrink-0
        z-40
        backdrop-blur-md
        shadow-sm
      "
    >

      <div
        className="
          w-full
          flex
          items-center
          justify-between
          gap-2
          sm:gap-4
        "
      >

        {/* ===================================================
            Zone 1
            Campaign / Game Title
        =================================================== */}

        <div
          className="
            flex
            items-center
            gap-2.5
            shrink-0
            min-w-0
          "
        >

          <div
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              sm:w-9
              sm:h-9
              rounded-xl
              bg-blue-600
              text-white
              shadow-sm
              shrink-0
            "
          >

            <ShieldCheck
              className="
                w-4
                h-4
                sm:w-5
                sm:h-5
              "
            />

          </div>


          <div
            className="
              hidden
              md:flex
              flex-col
              min-w-0
            "
          >

            <span
              className="
                text-[10px]
                lg:text-xs
                text-blue-600
                font-bold
                leading-none
                mb-1
              "
            >
              정보보호 캠페인
            </span>


            <span
              className="
                font-black
                text-slate-900
                tracking-tight
                truncate
                max-w-[220px]
                xl:max-w-[320px]
              "
              style={{
                fontSize:
                  'clamp(14px, 1vw, 20px)',
              }}
            >
              {gameTitle}
            </span>

          </div>

        </div>


        {/* ===================================================
            Zone 2
            Game Status
        =================================================== */}

        <div
          className="
            flex
            items-center
            justify-center
            gap-1.5
            sm:gap-2.5
            lg:gap-3
            flex-1
            min-w-0
          "
        >

          {/* =================================================
              전체 남은 시간
          ================================================= */}

          <div
            className={`
              flex
              items-center
              gap-1.5
              sm:gap-2
              px-2.5
              sm:px-3.5
              py-1.5
              rounded-xl
              border
              transition-all
              shrink-0
              ${
                isUrgent
                  ? `
                    bg-rose-50
                    border-rose-300
                    text-rose-700
                    ring-2
                    ring-rose-100
                    animate-pulse
                  `
                  : `
                    bg-sky-50
                    border-sky-100
                    text-slate-800
                  `
              }
            `}
          >

            <Clock3
              className={`
                w-4
                h-4
                sm:w-5
                sm:h-5
                ${
                  isUrgent
                    ? 'text-rose-500'
                    : 'text-blue-600'
                }
              `}
            />


            <div
              className="
                flex
                flex-col
                leading-none
              "
            >

              <span
                className="
                  hidden
                  sm:block
                  text-[9px]
                  text-slate-500
                  font-bold
                  mb-0.5
                "
              >
                전체 남은 시간
              </span>


              <span
                className={`
                  font-mono
                  font-black
                  tabular-nums
                  tracking-wide
                  ${
                    isUrgent
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }
                `}
                style={{
                  fontSize:
                    'clamp(15px, 1.1vw, 22px)',
                }}
              >
                {timeFormatted}
              </span>

            </div>

          </div>


          {/* =================================================
              기회
          ================================================= */}

          <div
            className={`
              flex
              items-center
              gap-1.5
              sm:gap-2
              px-2.5
              sm:px-3.5
              py-1.5
              rounded-xl
              border
              shrink-0
              transition-all
              ${
                isLifeDanger
                  ? `
                    bg-rose-100
                    border-rose-300
                    ring-2
                    ring-rose-100
                  `
                  : `
                    bg-rose-50
                    border-rose-100
                  `
              }
            `}
            aria-label={`남은 기회 ${lives}회`}
          >

            <CircleDot
              className={`
                w-4
                h-4
                sm:w-5
                sm:h-5
                ${
                  isLifeDanger
                    ? 'text-rose-600'
                    : 'text-rose-500'
                }
              `}
            />


            <div
              className="
                flex
                items-baseline
                gap-1
              "
            >

              <span
                className="
                  hidden
                  sm:inline
                  text-[10px]
                  sm:text-xs
                  font-bold
                  text-slate-500
                "
              >
                기회
              </span>


              <span
                className={`
                  text-base
                  sm:text-lg
                  font-black
                  tabular-nums
                  ${
                    isLifeDanger
                      ? 'text-rose-700'
                      : 'text-slate-900'
                  }
                `}
              >
                {lives}
              </span>


              <span
                className="
                  text-[10px]
                  sm:text-xs
                  font-bold
                  text-slate-500
                "
              >
                /
                {maxLives}
              </span>

            </div>

          </div>


          {/* =================================================
              완료
          ================================================= */}

          <div
            className="
              flex
              items-center
              gap-1.5
              sm:gap-2
              px-2.5
              sm:px-3.5
              py-1.5
              rounded-xl
              bg-emerald-50
              border
              border-emerald-100
              shrink-0
            "
          >

            <CheckCircle2
              className="
                w-4
                h-4
                sm:w-5
                sm:h-5
                text-emerald-600
              "
            />


            <div
              className="
                flex
                items-baseline
                gap-1
              "
            >

              <span
                className="
                  hidden
                  sm:inline
                  text-[10px]
                  sm:text-xs
                  font-bold
                  text-slate-500
                "
              >
                완료
              </span>


              <span
                className="
                  text-base
                  sm:text-lg
                  font-black
                  text-emerald-700
                  tabular-nums
                "
              >
                {foundCount}
              </span>


              <span
                className="
                  text-xs
                  sm:text-sm
                  font-bold
                  text-slate-400
                "
              >
                /
              </span>


              <span
                className="
                  text-sm
                  sm:text-base
                  font-bold
                  text-slate-700
                  tabular-nums
                "
              >
                {totalAnswers}
              </span>

            </div>

          </div>


          {/* =================================================
              Hint
          ================================================= */}

          <button
            type="button"
            onClick={
              onUseHint
            }
            disabled={
              isHintDisabled
            }
            className={`
              flex
              items-center
              gap-1.5
              sm:gap-2
              px-2.5
              sm:px-3.5
              py-1.5
              rounded-xl
              border
              font-bold
              transition-all
              shrink-0
              ${
                isHintDisabled
                  ? `
                    bg-slate-50
                    text-slate-400
                    border-slate-200
                    cursor-not-allowed
                  `
                  : `
                    bg-amber-50
                    text-amber-700
                    border-amber-200
                    hover:bg-amber-100
                    hover:border-amber-300
                    active:scale-[0.98]
                    cursor-pointer
                  `
              }
            `}
            style={{
              fontSize:
                'clamp(11px, 0.85vw, 14px)',
            }}
          >

            <Lightbulb
              className={`
                w-4
                h-4
                ${
                  isHintDisabled
                    ? 'text-slate-400'
                    : 'text-amber-500'
                }
              `}
            />


            <span
              className="
                whitespace-nowrap
              "
            >
              {
                hintCount <= 0
                  ? '힌트 없음'
                  : `힌트 ${hintCount}`
              }
            </span>

          </button>

        </div>


        {/* ===================================================
            Zone 3
            Utility
        =================================================== */}

        <div
          className="
            flex
            items-center
            gap-1.5
            sm:gap-2
            shrink-0
          "
        >

          {/* =================================================
              Sound
          ================================================= */}

          <button
            type="button"
            onClick={
              onToggleSound
            }
            title={
              isMuted
                ? '소리 켜기'
                : '소리 끄기'
            }
            aria-label={
              isMuted
                ? '소리 켜기'
                : '소리 끄기'
            }
            className="
              p-2
              rounded-xl
              text-slate-500
              hover:text-blue-700
              hover:bg-blue-50
              transition-colors
            "
          >

            {
              isMuted
                ? (
                  <VolumeX
                    className="
                      w-4
                      h-4
                    "
                  />
                )
                : (
                  <Volume2
                    className="
                      w-4
                      h-4
                    "
                  />
                )
            }

          </button>


          {/* =================================================
              Admin
          ================================================= */}

          <Link
            to="/admin"
            title="관리자 설정으로 이동"
            className="
              hidden
              sm:flex
              items-center
              gap-1.5
              px-2.5
              py-1.5
              rounded-lg
              text-xs
              font-semibold
              text-slate-500
              hover:text-blue-700
              bg-slate-50
              hover:bg-blue-50
              border
              border-slate-200
              hover:border-blue-200
              transition-colors
            "
          >

            <Settings
              className="
                w-3.5
                h-3.5
              "
            />


            <span
              className="
                whitespace-nowrap
              "
            >
              관리자
            </span>

          </Link>

        </div>

      </div>

    </header>
  );
};