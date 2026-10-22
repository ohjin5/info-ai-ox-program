import React from 'react';

import {
  Award,
  AlertTriangle,
  RotateCcw,
  Clock3,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  CircleDot,
  Sparkles,
  Target,
} from 'lucide-react';

import type {
  SecurityAnswer,
} from '../services/apiService';

import {
  DEFAULT_CONFIG,
} from '../constants/config';


interface ResultScreenProps {

  isSuccess:
    boolean;

  /*
   * 위치 + 4지선다까지
   * 모두 맞힌 문제
   */
  foundAnswers:
    SecurityAnswer[];

  /*
   * 이번 게임에 출제된
   * 전체 문제의 정답
   */
  allAnswers:
    SecurityAnswer[];

  livesLeft:
    number;

  maxLives:
    number;

  timeSpent:
    number;

  failReason:
    | 'TIME_OUT'
    | 'NO_LIVES'
    | null;

  onRestart:
    () => void;
}


/* =========================================================
   Answer 동일 여부

   신규 구조에서는 answer.id가
   문제마다 1일 수 있으므로 id만 비교하지 않음

   우선순위:
   1. vulnerabilityId
   2. title
========================================================= */

const isSameAnswer =
  (
    a:
      SecurityAnswer,

    b:
      SecurityAnswer
  ):
    boolean => {

    if (
      a.vulnerabilityId &&
      b.vulnerabilityId
    ) {

      return (
        a.vulnerabilityId ===
        b.vulnerabilityId
      );
    }


    return (
      a.title ===
      b.title
    );
  };


/* =========================================================
   ResultScreen
========================================================= */

export const ResultScreen:
React.FC<ResultScreenProps> = ({

  isSuccess,

  foundAnswers,

  allAnswers,

  livesLeft,

  maxLives,

  timeSpent,

  failReason,

  onRestart,

}) => {


  /* =========================================================
     놓친 문제
  ========================================================= */

  const unfoundAnswers =
    allAnswers.filter(
      answer =>
        !foundAnswers.some(
          found =>
            isSameAnswer(
              found,
              answer
            )
        )
    );


  /* =========================================================
     완료율
  ========================================================= */

  const completeRate =
    allAnswers.length >
      0
      ? Math.round(
          (
            foundAnswers.length /
            allAnswers.length
          ) *
          100
        )
      : 0;


  /* =========================================================
     결과 제목
  ========================================================= */

  const resultTitle =
    isSuccess
      ? '성공!'
      : '실패!';


  /* =========================================================
     결과 설명
  ========================================================= */

  const resultMessage =
    isSuccess
      ? '모든 보안 취약점의 위치와 유형을 정확하게 맞혔습니다.'
      : failReason ===
          'TIME_OUT'
        ? '제한시간 60초가 종료되었습니다. 놓친 보안 취약점을 확인해보세요.'
        : failReason ===
            'NO_LIVES'
          ? '기회를 모두 사용했습니다. 놓친 보안 취약점을 확인해보세요.'
          : '이번에 놓친 보안 취약점을 확인해보세요.';


  /* =========================================================
     결과 보조 문구
  ========================================================= */

  const resultSubMessage =
    isSuccess
      ? '정보보호 미션을 성공적으로 완료했습니다!'
      : failReason ===
          'TIME_OUT'
        ? '조금 더 빠르게 보안 위험을 찾아보세요.'
        : failReason ===
            'NO_LIVES'
          ? '위치와 취약점 유형을 다시 확인해보세요.'
          : '다시 도전해서 모든 문제를 해결해보세요.';


  /* =========================================================
     시간
  ========================================================= */

  const safeTimeSpent =
    Math.max(
      0,
      Math.min(
        60,
        timeSpent
      )
    );


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        max-w-5xl
        mx-auto
        my-auto
        p-4
        sm:p-6
        animate-fade-in
        text-slate-900
      "
    >

      <div
        className="
          bg-white
          rounded-[30px]
          shadow-xl
          shadow-sky-100/70
          border
          border-sky-100
          overflow-hidden
        "
      >

        {/* =====================================================
            Result Banner
        ===================================================== */}

        <div
          className={`
            p-7
            sm:p-9
            text-center
            relative
            overflow-hidden
            border-b
            ${
              isSuccess
                ? `
                  bg-gradient-to-br
                  from-emerald-50
                  via-white
                  to-sky-50
                  border-emerald-100
                `
                : `
                  bg-gradient-to-br
                  from-rose-50
                  via-white
                  to-amber-50
                  border-rose-100
                `
            }
          `}
        >

          {/* Background Decoration */}

          <div
            className="
              absolute
              -top-16
              -left-16
              w-52
              h-52
              rounded-full
              bg-sky-100/50
              blur-3xl
              pointer-events-none
            "
          />


          <div
            className={`
              absolute
              -bottom-16
              -right-12
              w-56
              h-56
              rounded-full
              blur-3xl
              pointer-events-none
              ${
                isSuccess
                  ? 'bg-emerald-100/40'
                  : 'bg-rose-100/40'
              }
            `}
          />


          <div
            className="
              relative
              z-10
              flex
              flex-col
              items-center
            "
          >

            {/* Icon */}

            <div
              className={`
                w-16
                h-16
                sm:w-20
                sm:h-20
                rounded-2xl
                flex
                items-center
                justify-center
                mb-4
                shadow-sm
                border
                ${
                  isSuccess
                    ? `
                      bg-emerald-50
                      text-emerald-600
                      border-emerald-200
                    `
                    : `
                      bg-rose-50
                      text-rose-600
                      border-rose-200
                    `
                }
              `}
            >

              {
                isSuccess
                  ? (
                      <Award
                        className="
                          w-10
                          h-10
                          sm:w-12
                          sm:h-12
                        "
                      />
                    )
                  : (
                      <AlertTriangle
                        className="
                          w-10
                          h-10
                          sm:w-12
                          sm:h-12
                        "
                      />
                    )
              }

            </div>


            {/* Campaign Badge */}

            <div
              className="
                inline-flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded-full
                bg-white
                border
                border-sky-100
                text-blue-700
                text-xs
                font-bold
                shadow-sm
                mb-3
              "
            >

              <ShieldCheck
                className="
                  w-4
                  h-4
                "
              />

              <span>
                정보보호 캠페인 결과
              </span>

            </div>


            {/* Title */}

            <h2
              className={`
                font-black
                tracking-tight
                mb-2
                ${
                  isSuccess
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }
              `}
              style={{
                fontSize:
                  'clamp(32px, 3vw, 52px)',
              }}
            >
              {resultTitle}
            </h2>


            {/* Description */}

            <p
              className="
                text-slate-600
                max-w-2xl
                mx-auto
                leading-relaxed
                font-medium
              "
              style={{
                fontSize:
                  'clamp(14px, 1.1vw, 19px)',
              }}
            >
              {resultMessage}
            </p>


            {/* Result Badge */}

            <div
              className={`
                mt-4
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-xl
                border
                font-bold
                ${
                  isSuccess
                    ? `
                      bg-emerald-50
                      border-emerald-100
                      text-emerald-700
                    `
                    : `
                      bg-rose-50
                      border-rose-100
                      text-rose-700
                    `
                }
              `}
            >

              {
                isSuccess
                  ? (
                      <Sparkles
                        className="
                          w-4
                          h-4
                        "
                      />
                    )
                  : (
                      <AlertTriangle
                        className="
                          w-4
                          h-4
                        "
                      />
                    )
              }


              <span>
                {resultSubMessage}
              </span>

            </div>

          </div>

        </div>


        {/* =====================================================
            Content
        ===================================================== */}

        <div
          className="
            p-5
            sm:p-8
            space-y-6
          "
        >

          {/* ===================================================
              Stats
          =================================================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-3
              sm:gap-4
            "
          >

            {/* 완료 문제 */}

            <div
              className="
                p-4
                rounded-2xl
                bg-emerald-50/70
                border
                border-emerald-100
                text-center
              "
            >

              <div
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                  mb-1
                "
              >
                완료한 문제
              </div>


              <div
                className="
                  font-black
                  text-emerald-700
                  tabular-nums
                "
                style={{
                  fontSize:
                    'clamp(20px, 1.8vw, 32px)',
                }}
              >

                {foundAnswers.length}

                <span
                  className="
                    text-sm
                    sm:text-base
                    font-bold
                    text-slate-400
                  "
                >
                  {' '}
                  / {allAnswers.length}
                </span>

              </div>


              <div
                className="
                  text-[11px]
                  text-emerald-600
                  font-semibold
                  mt-1
                "
              >
                완료율 {completeRate}%
              </div>

            </div>


            {/* 남은 기회 */}

            <div
              className="
                p-4
                rounded-2xl
                bg-rose-50/70
                border
                border-rose-100
                text-center
              "
            >

              <div
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                  mb-1
                "
              >
                남은 기회
              </div>


              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-1
                "
              >

                <CircleDot
                  className="
                    w-5
                    h-5
                    text-rose-500
                  "
                />


                <span
                  className="
                    font-black
                    text-slate-900
                    tabular-nums
                  "
                  style={{
                    fontSize:
                      'clamp(20px, 1.8vw, 32px)',
                  }}
                >
                  {livesLeft}
                </span>


                <span
                  className="
                    text-sm
                    font-bold
                    text-slate-500
                  "
                >
                  /
                  {maxLives}
                </span>

              </div>


              <div
                className="
                  text-[11px]
                  text-slate-400
                  font-semibold
                  mt-1
                "
              >
                위치 또는 보기 오답 시 1회 차감
              </div>

            </div>


            {/* 소요 시간 */}

            <div
              className="
                p-4
                rounded-2xl
                bg-sky-50/70
                border
                border-sky-100
                text-center
              "
            >

              <div
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                  mb-1
                "
              >
                소요 시간
              </div>


              <div
                className="
                  font-black
                  text-slate-900
                  tabular-nums
                  flex
                  items-center
                  justify-center
                  gap-1.5
                "
                style={{
                  fontSize:
                    'clamp(20px, 1.8vw, 32px)',
                }}
              >

                <Clock3
                  className="
                    w-5
                    h-5
                    text-blue-500
                  "
                />


                <span>
                  {safeTimeSpent}초
                </span>

              </div>


              <div
                className="
                  text-[11px]
                  text-slate-400
                  font-semibold
                  mt-1
                "
              >
                전체 제한시간 60초
              </div>

            </div>

          </div>


          {/* ===================================================
              출제된 보안 취약점
          =================================================== */}

          <div
            className="
              space-y-3
            "
          >

            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-1
              "
            >

              <h3
                className="
                  text-sm
                  sm:text-base
                  font-bold
                  text-slate-800
                  flex
                  items-center
                  gap-2
                "
              >

                <Target
                  className="
                    w-5
                    h-5
                    text-blue-600
                  "
                />

                <span>
                  이번 게임에 출제된 보안 취약점
                </span>

              </h3>


              <span
                className="
                  text-[11px]
                  sm:text-xs
                  text-slate-400
                  font-semibold
                "
              >
                위치와 취약점 종류를 모두 맞혀야 완료됩니다.
              </span>

            </div>


            <div
              className="
                space-y-2.5
              "
            >

              {allAnswers.map(
                (
                  item,
                  index
                ) => {

                  const wasFound =
                    foundAnswers.some(
                      found =>
                        isSameAnswer(
                          found,
                          item
                        )
                    );


                  return (

                    <div
                      key={
                        item.vulnerabilityId ||
                        `${item.title}-${index}`
                      }
                      className={`
                        p-3.5
                        sm:p-4
                        rounded-xl
                        border
                        text-xs
                        sm:text-sm
                        ${
                          wasFound
                            ? `
                              bg-emerald-50
                              border-emerald-200
                            `
                            : `
                              bg-amber-50
                              border-amber-200
                            `
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                      >

                        <div
                          className="
                            flex
                            items-start
                            gap-3
                            min-w-0
                            flex-1
                          "
                        >

                          {/* Number */}

                          <div
                            className={`
                              w-7
                              h-7
                              rounded-full
                              flex
                              items-center
                              justify-center
                              shrink-0
                              text-xs
                              font-black
                              ${
                                wasFound
                                  ? `
                                    bg-emerald-100
                                    text-emerald-700
                                  `
                                  : `
                                    bg-amber-100
                                    text-amber-700
                                  `
                              }
                            `}
                          >
                            {index + 1}
                          </div>


                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                font-bold
                                text-slate-900
                              "
                            >

                              {
                                wasFound
                                  ? (
                                      <CheckCircle2
                                        className="
                                          w-4
                                          h-4
                                          text-emerald-600
                                          shrink-0
                                        "
                                      />
                                    )
                                  : (
                                      <XCircle
                                        className="
                                          w-4
                                          h-4
                                          text-amber-600
                                          shrink-0
                                        "
                                      />
                                    )
                              }


                              <span>
                                {item.title}
                              </span>

                            </div>


                            <p
                              className="
                                text-xs
                                sm:text-sm
                                text-slate-600
                                leading-relaxed
                                mt-1.5
                              "
                            >
                              {
                                item.explanation ||
                                '정보보호 수칙에 따라 안전하게 관리해야 하는 항목입니다.'
                              }
                            </p>

                          </div>

                        </div>


                        <span
                          className={`
                            text-[11px]
                            font-semibold
                            px-2.5
                            py-1
                            rounded-full
                            shrink-0
                            border
                            ${
                              wasFound
                                ? `
                                  bg-white
                                  text-emerald-700
                                  border-emerald-200
                                `
                                : `
                                  bg-white
                                  text-amber-700
                                  border-amber-200
                                `
                            }
                          `}
                        >

                          {
                            wasFound
                              ? '정답 완료'
                              : '미완료'
                          }

                        </span>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          </div>


          {/* ===================================================
              실패 시 놓친 문제 요약
          =================================================== */}

          {!isSuccess &&
            unfoundAnswers.length >
              0 && (

            <div
              className="
                p-4
                rounded-2xl
                bg-amber-50
                border
                border-amber-200
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-2.5
                "
              >

                <AlertTriangle
                  className="
                    w-5
                    h-5
                    text-amber-600
                    shrink-0
                    mt-0.5
                  "
                />


                <div>

                  <div
                    className="
                      text-sm
                      font-bold
                      text-amber-900
                    "
                  >
                    놓친 보안 취약점
                  </div>


                  <p
                    className="
                      text-xs
                      sm:text-sm
                      text-amber-800
                      leading-relaxed
                      mt-1
                    "
                  >
                    {
                      unfoundAnswers
                        .map(
                          answer =>
                            answer.title
                        )
                        .join(
                          ', '
                        )
                    }
                  </p>

                </div>

              </div>

            </div>

          )}


          {/* ===================================================
              Slogan
          =================================================== */}

          <div
            className="
              p-4
              rounded-2xl
              bg-blue-50
              border
              border-blue-100
              text-center
            "
          >

            <p
              className="
                text-sm
                sm:text-base
                font-bold
                text-blue-700
              "
            >
              {DEFAULT_CONFIG.campaignSlogan}
            </p>

          </div>


          {/* ===================================================
              Restart
          =================================================== */}

          <div
            className="
              pt-1
              flex
              justify-center
            "
          >

            <button
              type="button"
              onClick={
                onRestart
              }
              className="
                w-full
                max-w-sm
                py-4
                px-6
                rounded-2xl
                font-black
                text-white
                bg-blue-600
                hover:bg-blue-700
                active:bg-blue-800
                shadow-lg
                shadow-blue-200
                hover:-translate-y-0.5
                transition-all
                flex
                items-center
                justify-center
                gap-2
                cursor-pointer
              "
              style={{
                fontSize:
                  'clamp(16px, 1.1vw, 21px)',
              }}
            >

              <RotateCcw
                className="
                  w-5
                  h-5
                "
              />


              <span>
                새로운 3문제로 다시 도전하기
              </span>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};