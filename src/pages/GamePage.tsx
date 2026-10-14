import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  getConfig,
  getQuestions,
  resolveQuestionImages,
  type Question,
  type SecurityAnswer,
  type GameConfig,
} from '../services/apiService';

import {
  DEFAULT_CONFIG,
} from '../constants/config';

import {
  StartScreen,
} from '../components/StartScreen';

import {
  GameHUD,
} from '../components/GameHUD';

import {
  ImageComparison,
} from '../components/ImageComparison';

import {
  HintModal,
} from '../components/HintModal';

import {
  ResultScreen,
} from '../components/ResultScreen';

import {
  soundManager,
} from '../utils/audio';

import {
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';


/* =========================================================
   Demo Question
========================================================= */

const DEMO_QUESTION: Question = {
  id: 'demo-nurse-station',

  title:
    '간호사 스테이션 보안 취약점 찾기',

  normalImageUrl:
    '/images/security-normal.png',

  riskImageUrl:
    '/images/security-risk.png',

  answers: [
    {
      id: 1,

      x: 35.0,

      y: 42.0,

      radius: 8,

      title:
        '환자정보 화면 노출',

      hint:
        '가운데 업무용 PC 화면을 확인해보세요.',

      explanation:
        '업무용 PC 모니터에 환자 개인정보가 노출되어 있습니다. 자리를 비울 때는 반드시 화면을 잠그거나 로그아웃해야 합니다.',
    },

    {
      id: 2,

      x: 9.0,

      y: 78.0,

      radius: 8,

      title:
        '진료정보 문서 폐기',

      hint:
        '화면 왼쪽 아래를 확인해보세요.',

      explanation:
        '환자정보가 포함된 문서가 일반 휴지통에 버려져 있습니다. 개인정보 문서는 지정된 절차에 따라 안전하게 파기해야 합니다.',
    },

    {
      id: 3,

      x: 52.0,

      y: 66.0,

      radius: 8,

      title:
        '직원증 노출',

      hint:
        '의자 주변을 확인해보세요.',

      explanation:
        '외부에서 식별 가능한 직원증이 방치되어 있습니다. 직원증과 출입증은 분실 또는 무단사용되지 않도록 관리해야 합니다.',
    },

    {
      id: 4,

      x: 86.0,

      y: 66.0,

      radius: 8,

      title:
        '비밀번호 메모 노출',

      hint:
        '오른쪽 컴퓨터 주변을 확인해보세요.',

      explanation:
        '아이디와 비밀번호가 메모지에 적혀 외부에 노출되어 있습니다. 계정정보는 메모지에 적어 모니터나 책상에 붙여두면 안 됩니다.',
    },
  ],

  timeLimit: 60,

  lives: 3,

  hintCount: 1,

  active: true,
};


/* =========================================================
   Play State
========================================================= */

type PlayState =
  | 'LOADING'
  | 'START'
  | 'PLAYING'
  | 'RESULT'
  | 'EMPTY'
  | 'ERROR';


/* =========================================================
   GamePage
========================================================= */

export const GamePage:
React.FC = () => {

  const [
    playState,
    setPlayState,
  ] =
    useState<PlayState>(
      'LOADING'
    );


  const [
    config,
    setConfig,
  ] =
    useState<GameConfig>(
      DEFAULT_CONFIG
    );


  const [
    activeQuestions,
    setActiveQuestions,
  ] =
    useState<Question[]>(
      []
    );


  const [
    currentQuestion,
    setCurrentQuestion,
  ] =
    useState<Question | null>(
      null
    );


  /* =========================================================
     표시 이미지
  ========================================================= */

  const [
    normalImageSrc,
    setNormalImageSrc,
  ] =
    useState<string>(
      ''
    );


  const [
    riskImageSrc,
    setRiskImageSrc,
  ] =
    useState<string>(
      ''
    );


  /* =========================================================
     Game State
  ========================================================= */

  const [
    timeLeft,
    setTimeLeft,
  ] =
    useState<number>(
      60
    );


  /*
   * 내부 데이터 구조는 lives 유지
   * 화면에서는 "기회"로 표시
   */
  const [
    lives,
    setLives,
  ] =
    useState<number>(
      3
    );


  const [
    hintCount,
    setHintCount,
  ] =
    useState<number>(
      1
    );


  const [
    foundAnswerIds,
    setFoundAnswerIds,
  ] =
    useState<number[]>(
      []
    );


  const [
    isHintOpen,
    setIsHintOpen,
  ] =
    useState<boolean>(
      false
    );


  const [
    currentHintText,
    setCurrentHintText,
  ] =
    useState<string>(
      ''
    );


  const [
    activeExplanation,
    setActiveExplanation,
  ] =
    useState<{
      title: string;
      text: string;
    } | null>(
      null
    );


  const [
    isMuted,
    setIsMuted,
  ] =
    useState<boolean>(
      !soundManager.isEnabled()
    );


  /* =========================================================
     Image State
  ========================================================= */

  const [
    isLoadingImages,
    setIsLoadingImages,
  ] =
    useState<boolean>(
      true
    );


  const [
    imageLoadError,
    setImageLoadError,
  ] =
    useState<boolean>(
      false
    );


  /* =========================================================
     Result State
  ========================================================= */

  const [
    isSuccess,
    setIsSuccess,
  ] =
    useState<boolean>(
      false
    );


  const [
    timeSpent,
    setTimeSpent,
  ] =
    useState<number>(
      0
    );


  const [
    failReason,
    setFailReason,
  ] =
    useState<
      'TIME_OUT' |
      'NO_LIVES' |
      null
    >(
      null
    );


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );


  /* =========================================================
     Refs
  ========================================================= */

  const timerRef =
    useRef<
      ReturnType<typeof setInterval> |
      null
    >(
      null
    );


  const explanationTimeoutRef =
    useRef<
      ReturnType<typeof setTimeout> |
      null
    >(
      null
    );


  const isFinishedRef =
    useRef<boolean>(
      false
    );


  /* =========================================================
     Image Preload
  ========================================================= */

  const preloadImages =
    useCallback(
      async (
        normalSrc: string,
        riskSrc: string
      ) => {

        setIsLoadingImages(
          true
        );

        setImageLoadError(
          false
        );


        if (
          !normalSrc ||
          !riskSrc
        ) {

          setImageLoadError(
            true
          );

          setIsLoadingImages(
            false
          );

          return false;
        }


        const preload =
          (
            src: string
          ) =>
            new Promise<void>(
              (
                resolve,
                reject
              ) => {

                const img =
                  new Image();


                img.onload =
                  () =>
                    resolve();


                img.onerror =
                  () =>
                    reject(
                      new Error(
                        '이미지 로드 실패'
                      )
                    );


                img.src =
                  src;
              }
            );


        try {

          await Promise.all([
            preload(
              normalSrc
            ),

            preload(
              riskSrc
            ),
          ]);


          setIsLoadingImages(
            false
          );


          return true;

        } catch (error) {

          console.error(
            '이미지 preload 오류:',
            error
          );


          setImageLoadError(
            true
          );


          setIsLoadingImages(
            false
          );


          return false;
        }
      },
      []
    );


  /* =========================================================
     Question Setup
  ========================================================= */

  const setupQuestion =
    useCallback(
      async (
        q: Question,
        cfg: GameConfig
      ) => {

        setCurrentQuestion(
          q
        );


        const initialTime =
          q.timeLimit ||
          cfg.defaultTimeLimit ||
          60;


        const initialLives =
          q.lives ||
          cfg.defaultLives ||
          3;


        const initialHints =
          q.hintCount !==
          undefined
            ? q.hintCount
            : (
                cfg.defaultHintCount ??
                1
              );


        setTimeLeft(
          initialTime
        );


        setLives(
          initialLives
        );


        setHintCount(
          initialHints
        );


        setFoundAnswerIds(
          []
        );


        setIsSuccess(
          false
        );


        setFailReason(
          null
        );


        setIsHintOpen(
          false
        );


        setCurrentHintText(
          ''
        );


        setActiveExplanation(
          null
        );


        isFinishedRef.current =
          false;


        setNormalImageSrc(
          ''
        );


        setRiskImageSrc(
          ''
        );


        setIsLoadingImages(
          true
        );


        setImageLoadError(
          false
        );


        try {

          const imageResult =
            await resolveQuestionImages(
              q
            );


          if (
            !imageResult.success ||
            !imageResult.data
          ) {

            console.error(
              '문제 이미지 조회 실패:',
              imageResult.error
            );


            setImageLoadError(
              true
            );


            setIsLoadingImages(
              false
            );


            return false;
          }


          const {
            normalImageSrc:
              resolvedNormalSrc,

            riskImageSrc:
              resolvedRiskSrc,
          } =
            imageResult.data;


          setNormalImageSrc(
            resolvedNormalSrc
          );


          setRiskImageSrc(
            resolvedRiskSrc
          );


          return await preloadImages(
            resolvedNormalSrc,
            resolvedRiskSrc
          );

        } catch (error) {

          console.error(
            '문제 이미지 처리 오류:',
            error
          );


          setImageLoadError(
            true
          );


          setIsLoadingImages(
            false
          );


          return false;
        }
      },
      [
        preloadImages,
      ]
    );


  /* =========================================================
     Config + Questions
  ========================================================= */

  const loadGameData =
    useCallback(
      async () => {

        setPlayState(
          'LOADING'
        );


        setErrorMessage(
          null
        );


        try {

          const [
            configRes,
            questionsRes,
          ] =
            await Promise.all([
              getConfig(),
              getQuestions(),
            ]);


          const loadedConfig =
            (
              configRes.success &&
              configRes.data
            )
              ? configRes.data
              : DEFAULT_CONFIG;


          setConfig(
            loadedConfig
          );


          if (
            !questionsRes.success
          ) {

            setErrorMessage(
              questionsRes.error ||
              '게임 데이터를 불러오지 못했습니다.'
            );


            setPlayState(
              'ERROR'
            );


            return;
          }


          const all =
            questionsRes.data ||
            [];


          const actives =
            all.filter(
              q =>
                q.active
            );


          if (
            actives.length ===
            0
          ) {

            setActiveQuestions(
              []
            );


            setPlayState(
              'EMPTY'
            );


            return;
          }


          setActiveQuestions(
            actives
          );


          const chosen =
            actives[
              Math.floor(
                Math.random() *
                actives.length
              )
            ];


          await setupQuestion(
            chosen,
            loadedConfig
          );


          setPlayState(
            'START'
          );

        } catch (error) {

          console.error(
            '게임 데이터 로드 오류:',
            error
          );


          setErrorMessage(
            '게임 데이터를 불러오지 못했습니다.'
          );


          setPlayState(
            'ERROR'
          );
        }
      },
      [
        setupQuestion,
      ]
    );


  /* =========================================================
     Initial Load
  ========================================================= */

  useEffect(
    () => {

      void loadGameData();

    },
    [
      loadGameData,
    ]
  );


  /* =========================================================
     Timer
  ========================================================= */

  useEffect(
    () => {

      if (
        playState !==
        'PLAYING'
      ) {

        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );


          timerRef.current =
            null;
        }


        return;
      }


      timerRef.current =
        setInterval(
          () => {

            setTimeLeft(
              prev => {

                if (
                  prev <= 1
                ) {

                  if (
                    timerRef.current
                  ) {

                    clearInterval(
                      timerRef.current
                    );


                    timerRef.current =
                      null;
                  }


                  if (
                    !isFinishedRef.current
                  ) {

                    isFinishedRef.current =
                      true;


                    soundManager
                      .playGameOver();


                    const totalLimit =
                      currentQuestion
                        ?.timeLimit ||
                      config
                        .defaultTimeLimit ||
                      60;


                    setTimeSpent(
                      totalLimit
                    );


                    setIsSuccess(
                      false
                    );


                    setFailReason(
                      'TIME_OUT'
                    );


                    setPlayState(
                      'RESULT'
                    );
                  }


                  return 0;
                }


                return (
                  prev - 1
                );
              }
            );

          },
          1000
        );


      return () => {

        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );


          timerRef.current =
            null;
        }
      };

    },
    [
      playState,
      currentQuestion,
      config,
    ]
  );


  /* =========================================================
     Cleanup
  ========================================================= */

  useEffect(
    () => {

      return () => {

        if (
          explanationTimeoutRef.current
        ) {

          clearTimeout(
            explanationTimeoutRef.current
          );
        }


        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );
        }
      };

    },
    []
  );


  /* =========================================================
     Correct Answer
  ========================================================= */

  const handleCorrectAnswer =
    (
      answer:
        SecurityAnswer
    ) => {

      if (
        isFinishedRef.current ||
        !currentQuestion
      ) {

        return;
      }


      if (
        foundAnswerIds.includes(
          answer.id
        )
      ) {

        return;
      }


      soundManager
        .playCorrect();


      const newFoundIds = [
        ...foundAnswerIds,
        answer.id,
      ];


      setFoundAnswerIds(
        newFoundIds
      );


      /*
       * 이전 정답 설명 타이머 제거
       */
      if (
        explanationTimeoutRef.current
      ) {

        clearTimeout(
          explanationTimeoutRef.current
        );
      }


      /*
       * 중앙 정답 설명 표시
       */
      setActiveExplanation({
        title:
          answer.title,

        text:
          answer.explanation,
      });


      /*
       * 정답 설명은 1.6초 유지
       */
      explanationTimeoutRef.current =
        setTimeout(
          () => {

            setActiveExplanation(
              null
            );

          },
          1600
        );


      /* -------------------------------------------------------
         모든 정답 발견
      ------------------------------------------------------- */

      if (
        newFoundIds.length ===
        currentQuestion
          .answers.length
      ) {

        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );


          timerRef.current =
            null;
        }


        isFinishedRef.current =
          true;


        soundManager
          .playVictory();


        const totalLimit =
          currentQuestion
            .timeLimit ||
          config
            .defaultTimeLimit ||
          60;


        const spent =
          totalLimit -
          timeLeft;


        setTimeSpent(
          Math.max(
            0,
            spent
          )
        );


        setIsSuccess(
          true
        );


        setFailReason(
          null
        );


        /*
         * 마지막 정답도 1.6초 보여준 뒤
         * 결과 화면으로 이동
         */
        setTimeout(
          () => {

            setPlayState(
              'RESULT'
            );

          },
          1600
        );
      }
    };


  /* =========================================================
     Wrong Click
  ========================================================= */

  const handleWrongClick =
    () => {

      if (
        isFinishedRef.current ||
        !currentQuestion
      ) {

        return;
      }


      soundManager
        .playWrong();


      setLives(
        prev => {

          const next =
            prev - 1;


          if (
            next <= 0
          ) {

            if (
              timerRef.current
            ) {

              clearInterval(
                timerRef.current
              );


              timerRef.current =
                null;
            }


            if (
              !isFinishedRef.current
            ) {

              isFinishedRef.current =
                true;


              soundManager
                .playGameOver();


              const totalLimit =
                currentQuestion
                  .timeLimit ||
                config
                  .defaultTimeLimit ||
                60;


              const spent =
                totalLimit -
                timeLeft;


              setTimeSpent(
                Math.max(
                  0,
                  spent
                )
              );


              setIsSuccess(
                false
              );


              setFailReason(
                'NO_LIVES'
              );


              setTimeout(
                () => {

                  setPlayState(
                    'RESULT'
                  );

                },
                600
              );
            }


            return 0;
          }


          return next;
        }
      );
    };


  /* =========================================================
     Hint
  ========================================================= */

  const handleUseHint =
    () => {

      if (
        hintCount <= 0 ||
        !currentQuestion ||
        isFinishedRef.current
      ) {

        return;
      }


      soundManager
        .playClick();


      const unfound =
        currentQuestion
          .answers
          .filter(
            answer =>
              !foundAnswerIds
                .includes(
                  answer.id
                )
          );


      if (
        unfound.length ===
        0
      ) {

        return;
      }


      const randomAnswer =
        unfound[
          Math.floor(
            Math.random() *
              unfound.length
          )
        ];


      setCurrentHintText(
        randomAnswer.hint
      );


      setHintCount(
        h =>
          h - 1
      );


      setIsHintOpen(
        true
      );
    };


  /* =========================================================
     Sound
  ========================================================= */

  const handleToggleSound =
    () => {

      const next =
        soundManager.toggle();


      setIsMuted(
        !next
      );
    };


  /* =========================================================
     Restart
  ========================================================= */

  const handleRestart =
    async () => {

      if (
        activeQuestions.length ===
        0
      ) {

        return;
      }


      const chosen =
        activeQuestions[
          Math.floor(
            Math.random() *
              activeQuestions.length
          )
        ];


      await setupQuestion(
        chosen,
        config
      );


      setPlayState(
        'PLAYING'
      );
    };


  /* =========================================================
     Demo
  ========================================================= */

  const handleDemo =
    async () => {

      await setupQuestion(
        DEMO_QUESTION,
        DEFAULT_CONFIG
      );


      setConfig(
        DEFAULT_CONFIG
      );


      setPlayState(
        'START'
      );
    };


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        min-h-screen
        bg-gradient-to-br
        from-sky-50
        via-white
        to-cyan-50
        text-slate-900
        flex
        flex-col
        justify-between
        selection:bg-blue-600
        selection:text-white
      "
    >

      {/* =====================================================
          LOADING
      ===================================================== */}

      {playState ===
        'LOADING' && (

        <div
          className="
            flex-1
            flex
            flex-col
            items-center
            justify-center
            p-6
            text-center
          "
        >

          <div
            className="
              w-full
              max-w-md
              bg-white
              border
              border-sky-100
              rounded-3xl
              shadow-xl
              shadow-sky-100/70
              p-8
              sm:p-10
            "
          >

            <div
              className="
                w-14
                h-14
                mx-auto
                rounded-2xl
                bg-blue-50
                border
                border-blue-100
                flex
                items-center
                justify-center
                mb-5
              "
            >

              <div
                className="
                  w-7
                  h-7
                  border-[3px]
                  border-blue-200
                  border-t-blue-600
                  rounded-full
                  animate-spin
                "
              />

            </div>


            <div
              className="
                inline-flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded-full
                bg-blue-50
                text-blue-700
                text-xs
                font-bold
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
                정보보호 캠페인
              </span>

            </div>


            <h2
              className="
                text-xl
                sm:text-2xl
                font-black
                text-slate-900
                mb-2
              "
            >
              게임을 준비하고 있습니다.
            </h2>


            <p
              className="
                text-sm
                text-slate-500
              "
            >
              보안 캠페인 데이터를 불러오는 중입니다...
            </p>

          </div>

        </div>
      )}


      {/* =====================================================
          ERROR
      ===================================================== */}

      {playState ===
        'ERROR' && (

        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            p-6
          "
        >

          <div
            className="
              w-full
              max-w-lg
              bg-white
              rounded-3xl
              border
              border-rose-100
              shadow-xl
              shadow-rose-100/50
              p-7
              sm:p-8
              text-center
            "
          >

            <div
              className="
                w-14
                h-14
                mx-auto
                mb-4
                rounded-2xl
                bg-rose-50
                border
                border-rose-100
                flex
                items-center
                justify-center
              "
            >

              <AlertCircle
                className="
                  w-7
                  h-7
                  text-rose-500
                "
              />

            </div>


            <h2
              className="
                text-xl
                font-black
                text-slate-900
                mb-2
              "
            >
              데이터를 불러오지 못했습니다.
            </h2>


            <p
              className="
                text-sm
                text-slate-500
                leading-relaxed
                mb-6
              "
            >
              {errorMessage}
            </p>


            <div
              className="
                flex
                flex-wrap
                items-center
                justify-center
                gap-2.5
              "
            >

              <button
                type="button"
                onClick={() =>
                  void loadGameData()
                }
                className="
                  px-5
                  py-2.5
                  bg-slate-100
                  hover:bg-slate-200
                  text-slate-700
                  rounded-xl
                  text-sm
                  font-bold
                  transition-colors
                  inline-flex
                  items-center
                  gap-2
                  cursor-pointer
                "
              >

                <RefreshCw
                  className="
                    w-4
                    h-4
                  "
                />

                <span>
                  다시 시도
                </span>

              </button>


              <button
                type="button"
                onClick={() =>
                  void handleDemo()
                }
                className="
                  px-5
                  py-2.5
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  rounded-xl
                  text-sm
                  font-bold
                  shadow-md
                  shadow-blue-200
                "
              >
                기본 문제로 체험하기
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          EMPTY
      ===================================================== */}

      {playState ===
        'EMPTY' && (

        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            p-6
          "
        >

          <div
            className="
              w-full
              max-w-md
              bg-white
              rounded-3xl
              border
              border-sky-100
              shadow-xl
              shadow-sky-100/60
              p-8
              text-center
            "
          >

            <div
              className="
                w-14
                h-14
                mx-auto
                mb-4
                rounded-2xl
                bg-blue-50
                border
                border-blue-100
                flex
                items-center
                justify-center
              "
            >

              <Sparkles
                className="
                  w-7
                  h-7
                  text-blue-600
                "
              />

            </div>


            <h2
              className="
                text-xl
                font-black
                text-slate-900
                mb-2
              "
            >
              현재 등록된 문제가 없습니다.
            </h2>


            <p
              className="
                text-sm
                text-slate-500
                leading-relaxed
                mb-6
              "
            >
              관리자 페이지에서 새로운 보안 위험 문제를 등록하고 활성화해주세요.
            </p>


            <div
              className="
                flex
                items-center
                justify-center
                gap-3
              "
            >

              <button
                type="button"
                onClick={() =>
                  void loadGameData()
                }
                className="
                  px-4
                  py-2.5
                  bg-slate-100
                  hover:bg-slate-200
                  text-slate-700
                  text-sm
                  font-bold
                  rounded-xl
                "
              >
                새로고침
              </button>


              <button
                type="button"
                onClick={() =>
                  void handleDemo()
                }
                className="
                  px-4
                  py-2.5
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  text-sm
                  font-bold
                  rounded-xl
                  shadow-md
                  shadow-blue-200
                "
              >
                기본 문제로 플레이
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          START
      ===================================================== */}

      {playState ===
        'START' &&
        currentQuestion && (

        <div
          className="
            flex-1
            flex
            flex-col
            justify-center
            items-center
            p-4
          "
        >

          <StartScreen
            gameTitle={
              config.gameTitle
            }

            totalRisksCount={
              currentQuestion
                .answers.length
            }

            timeLimit={
              currentQuestion
                .timeLimit ||
              config
                .defaultTimeLimit ||
              60
            }

            lives={
              currentQuestion
                .lives ||
              config
                .defaultLives ||
              3
            }

            hintCount={
              currentQuestion
                .hintCount ??
              config
                .defaultHintCount ??
              1
            }

            onStart={() =>
              setPlayState(
                'PLAYING'
              )
            }

            isLoadingImages={
              isLoadingImages
            }

            imageLoadError={
              imageLoadError
            }

            onRetryImageLoad={() =>
              void setupQuestion(
                currentQuestion,
                config
              )
            }
          />

        </div>
      )}


      {/* =====================================================
          PLAYING
      ===================================================== */}

      {playState ===
        'PLAYING' &&
        currentQuestion && (

        <div
          className="
            flex-1
            flex
            flex-col
            h-screen
            overflow-hidden
            bg-white
          "
        >

          <GameHUD
            gameTitle={
              config.gameTitle
            }

            timeLeft={
              timeLeft
            }

            lives={
              lives
            }

            maxLives={
              currentQuestion
                .lives ||
              config
                .defaultLives ||
              3
            }

            foundCount={
              foundAnswerIds.length
            }

            totalAnswers={
              currentQuestion
                .answers.length
            }

            hintCount={
              hintCount
            }

            onUseHint={
              handleUseHint
            }

            isMuted={
              isMuted
            }

            onToggleSound={
              handleToggleSound
            }
          />


          <ImageComparison
            normalImageUrl={
              normalImageSrc
            }

            riskImageUrl={
              riskImageSrc
            }

            answers={
              currentQuestion
                .answers
            }

            foundAnswerIds={
              foundAnswerIds
            }

            onCorrectAnswer={
              handleCorrectAnswer
            }

            onWrongClick={
              handleWrongClick
            }

            activeExplanation={
              activeExplanation
            }

            isGameOver={
              isFinishedRef.current
            }
          />


          <HintModal
            isOpen={
              isHintOpen
            }

            onClose={() =>
              setIsHintOpen(
                false
              )
            }

            hintText={
              currentHintText
            }
          />

        </div>
      )}


      {/* =====================================================
          RESULT
      ===================================================== */}

      {playState ===
        'RESULT' &&
        currentQuestion && (

        <div
          className="
            flex-1
            flex
            flex-col
            justify-center
            items-center
            p-4
          "
        >

          <ResultScreen
            isSuccess={
              isSuccess
            }

            foundAnswers={
              currentQuestion
                .answers
                .filter(
                  answer =>
                    foundAnswerIds
                      .includes(
                        answer.id
                      )
                )
            }

            allAnswers={
              currentQuestion
                .answers
            }

            livesLeft={
              lives
            }

            maxLives={
              currentQuestion
                .lives ||
              config
                .defaultLives ||
              3
            }

            timeSpent={
              timeSpent
            }

            failReason={
              failReason
            }

            onRestart={() =>
              void handleRestart()
            }
          />

        </div>
      )}

    </div>
  );
};