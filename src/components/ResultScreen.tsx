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
} from 'lucide-react';

import type {
  SecurityAnswer,
} from '../services/apiService';

import {
  DEFAULT_CONFIG,
} from '../constants/config';


interface ResultScreenProps {
  isSuccess: boolean;

  foundAnswers: SecurityAnswer[];

  allAnswers: SecurityAnswer[];

  livesLeft: number;

  maxLives: number;

  timeSpent: number;

  failReason:
    | 'TIME_OUT'
    | 'NO_LIVES'
    | null;

  onRestart: () => void;
}


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

  const unfoundAnswers =
    allAnswers.filter(
      ans =>
        !foundAnswers.some(
          fa =>
            fa.id ===
            ans.id
        )
    );


  const foundRate =
    allAnswers.length > 0
      ? Math.round(
          (
            foundAnswers.length /
            allAnswers.length
          ) * 100
        )
      : 0;


  const resultMessage =
    isSuccess
      ? '숨겨진 보안 위험을 모두 발견했습니다!'
      : failReason === 'TIME_OUT'
        ? '시간은 종료되었지만, 놓친 보안 위험을 함께 확인해보세요.'
        : failReason === 'NO_LIVES'
          ? '기회를 모두 사용했습니다. 놓친 보안 위험을 확인해보세요.'
          : '놓친 보안 위험을 함께 확인해보세요.';


  return (

    <div
      className="
        w-full
        max-w-4xl
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
            p-8
            sm:p-10
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
                  from-amber-50
                  via-white
                  to-rose-50
                  border-amber-100
                `
            }
          `}
        >

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
            className="
              absolute
              -bottom-16
              -right-12
              w-56
              h-56
              rounded-full
              bg-emerald-100/40
              blur-3xl
              pointer-events-none
            "
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
                      bg-amber-50
                      text-amber-600
                      border-amber-200
                    `
                }
              `}
            >

              {isSuccess ? (

                <Award
                  className="
                    w-10
                    h-10
                    sm:w-12
                    sm:h-12
                  "
                />

              ) : (

                <AlertTriangle
                  className="
                    w-10
                    h-10
                    sm:w-12
                    sm:h-12
                  "
                />
              )}

            </div>


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


            <h2
              className="
                font-black
                tracking-tight
                text-slate-900
                mb-2
              "
              style={{
                fontSize:
                  'clamp(26px, 2.5vw, 46px)',
              }}
            >
              {
                isSuccess
                  ? '보안 위험 발견 완료!'
                  : '도전 완료!'
              }
            </h2>


            <p
              className="
                text-slate-600
                max-w-xl
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


            {isSuccess && (

              <div
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  bg-emerald-50
                  border
                  border-emerald-100
                  text-emerald-700
                  font-bold
                "
              >

                <Sparkles
                  className="
                    w-4
                    h-4
                  "
                />

                <span>
                  모든 위험 요소를 찾았습니다!
                </span>

              </div>
            )}

          </div>

        </div>


        {/* =====================================================
            Stats
        ===================================================== */}

        <div
          className="
            p-5
            sm:p-8
            space-y-6
          "
        >

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-3
              sm:gap-4
            "
          >

            {/* 발견 */}

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
                발견한 보안 위험
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
                발견률 {foundRate}%
              </div>

            </div>


            {/* 기회 */}

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
                  회
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
                시작 {maxLives}회
              </div>

            </div>


            {/* 시간 */}

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
                  {timeSpent}초
                </span>

              </div>

            </div>

          </div>


          {/* ===================================================
              Checklist
          =================================================== */}

          <div
            className="
              space-y-3
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

              <ShieldCheck
                className="
                  w-5
                  h-5
                  text-blue-600
                "
              />

              <span>
                병원 정보보호 핵심 체크리스트
              </span>

            </h3>


            <div
              className="
                space-y-2.5
                max-h-[36vh]
                overflow-y-auto
                pr-1
              "
            >

              {allAnswers.map(
                item => {

                  const wasFound =
                    foundAnswers.some(
                      fa =>
                        fa.id ===
                        item.id
                    );


                  return (

                    <div
                      key={
                        item.id
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
                          items-center
                          justify-between
                          gap-3
                          mb-1
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            font-bold
                            text-slate-900
                            min-w-0
                          "
                        >

                          {wasFound ? (

                            <CheckCircle2
                              className="
                                w-4
                                h-4
                                text-emerald-600
                                shrink-0
                              "
                            />

                          ) : (

                            <XCircle
                              className="
                                w-4
                                h-4
                                text-amber-600
                                shrink-0
                              "
                            />
                          )}


                          <span
                            className="
                              truncate
                            "
                          >
                            {item.title}
                          </span>

                        </div>


                        <span
                          className={`
                            text-[11px]
                            font-semibold
                            px-2
                            py-0.5
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
                              ? '발견 완료'
                              : '놓친 위험'
                          }
                        </span>

                      </div>


                      <p
                        className="
                          text-xs
                          sm:text-sm
                          text-slate-600
                          pl-6
                          leading-relaxed
                        "
                      >
                        {item.explanation}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

          </div>


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
                다시 도전하기
              </span>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};