import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  getConfig,
  getQuestions,
  resolveQuestionImage,
  type Question,
  type SecurityAnswer,
  type GameConfig,
} from '../services/apiService';

import {
  DEFAULT_CONFIG,
} from '../constants/config';

import {
  SECURITY_VULNERABILITIES,
  createVulnerabilityChoices,
  pickRandomItems,
  type SecurityVulnerability,
} from '../constants/securityVulnerabilities';

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
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';


/* =========================================================
   Constants
========================================================= */

const GAME_TIME_LIMIT =
  60;

const GAME_LIVES =
  3;

const QUESTIONS_PER_GAME =
  3;

const CORRECT_FEEDBACK_TIME =
  1200;

const WRONG_CHOICE_FEEDBACK_TIME =
  500;


/* =========================================================
   Demo Questions
========================================================= */

const DEMO_QUESTIONS:
Question[] = [

  {
    id:
      'demo-emr',

    title:
      '간호사 스테이션 - EMR 화면 노출',

    imageUrl:
      '/images/security-risk.png',

    imageId:
      undefined,

    normalImageUrl:
      '',

    riskImageUrl:
      '/images/security-risk.png',

    answers: [
      {
        id:
          1,

        x:
          35,

        y:
          42,

        radius:
          8,

        vulnerabilityId:
          'EMR_SCREEN_EXPOSED',

        title:
          'EMR 화면 노출',

        hint:
          '업무용 PC 화면 주변을 확인해보세요.',

        explanation:
          'EMR 또는 의료정보시스템 화면이 주변 사람에게 노출되어 환자정보를 확인할 수 있는 상태입니다.',
      },
    ],

    answer: {
      id:
        1,

      x:
        35,

      y:
        42,

      radius:
        8,

      vulnerabilityId:
        'EMR_SCREEN_EXPOSED',

      title:
        'EMR 화면 노출',

      hint:
        '업무용 PC 화면 주변을 확인해보세요.',

      explanation:
        'EMR 또는 의료정보시스템 화면이 주변 사람에게 노출되어 환자정보를 확인할 수 있는 상태입니다.',
    },

    /*
     * 데모에서도 필요하면
     * 애매한 선택지를 제외할 수 있습니다.
     */
    excludedChoiceIds: [
      'PATIENT_NAME_EXPOSED',
      'PUBLIC_SPACE_PATIENT_INFO',
    ],

    timeLimit:
      60,

    lives:
      3,

    hintCount:
      1,

    active:
      true,
  },


  {
    id:
      'demo-password',

    title:
      '간호사 스테이션 - 계정정보 메모 방치',

    imageUrl:
      '/images/security-risk.png',

    normalImageUrl:
      '',

    riskImageUrl:
      '/images/security-risk.png',

    answers: [
      {
        id:
          1,

        x:
          84,

        y:
          65,

        radius:
          8,

        vulnerabilityId:
          'ACCOUNT_INFO_MEMO',

        title:
          '계정정보 메모 방치',

        hint:
          '모니터 또는 책상 주변을 확인해보세요.',

        explanation:
          '아이디나 비밀번호 등 계정정보를 적은 메모지가 모니터나 책상 등에 방치되어 있습니다.',
      },
    ],

    answer: {
      id:
        1,

      x:
        84,

      y:
        65,

      radius:
        8,

      vulnerabilityId:
        'ACCOUNT_INFO_MEMO',

      title:
        '계정정보 메모 방치',

      hint:
        '모니터 또는 책상 주변을 확인해보세요.',

      explanation:
        '아이디나 비밀번호 등 계정정보를 적은 메모지가 모니터나 책상 등에 방치되어 있습니다.',
    },

    excludedChoiceIds: [
      'ACCOUNT_PASSWORD_EXPOSED',
    ],

    timeLimit:
      60,

    lives:
      3,

    hintCount:
      1,

    active:
      true,
  },


  {
    id:
      'demo-document',

    title:
      '간호사 스테이션 - 개인정보 문서 일반폐기',

    imageUrl:
      '/images/security-risk.png',

    normalImageUrl:
      '',

    riskImageUrl:
      '/images/security-risk.png',

    answers: [
      {
        id:
          1,

        x:
          10,

        y:
          78,

        radius:
          8,

        vulnerabilityId:
          'PERSONAL_DOCUMENT_GENERAL_WASTE',

        title:
          '개인정보 문서 일반폐기',

        hint:
          '사진 아래쪽을 확인해보세요.',

        explanation:
          '개인정보가 포함된 문서가 보안 파기 절차 없이 일반 쓰레기로 폐기되고 있습니다.',
      },
    ],

    answer: {
      id:
        1,

      x:
        10,

      y:
        78,

      radius:
        8,

      vulnerabilityId:
        'PERSONAL_DOCUMENT_GENERAL_WASTE',

      title:
        '개인정보 문서 일반폐기',

      hint:
        '사진 아래쪽을 확인해보세요.',

      explanation:
        '개인정보가 포함된 문서가 보안 파기 절차 없이 일반 쓰레기로 폐기되고 있습니다.',
    },

    excludedChoiceIds: [
      'PERSONAL_MEMO_DISPOSAL',
    ],

    timeLimit:
      60,

    lives:
      3,

    hintCount:
      1,

    active:
      true,
  },

];


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
   Question의 실제 정답 인정 위치 전체 가져오기

   신규 구조:
   - 한 문제에 같은 취약점의 정답 위치를 여러 개 등록 가능
   - answers[] 전체를 유지

   Legacy:
   - answers[]가 없으면 answer 1개를 배열로 변환
   - vulnerabilityId가 없으면 title ↔ catalog label로 자동 연결
========================================================= */

const getQuestionAnswers =
  (
    question:
      Question
  ):
    SecurityAnswer[] => {

    const sourceAnswers =
      Array.isArray(
        question.answers
      ) &&
      question.answers.length >
        0
        ? question.answers
        : question.answer
          ? [
              question.answer,
            ]
          : [];


    return sourceAnswers
      .map(
        (
          sourceAnswer,
          index
        ):
          SecurityAnswer |
          null => {

          let vulnerability =
            sourceAnswer
              .vulnerabilityId
              ? SECURITY_VULNERABILITIES
                  .find(
                    item =>
                      item.id ===
                      sourceAnswer
                        .vulnerabilityId
                  )
              : undefined;


          /*
           * 기존 데이터 호환:
           * vulnerabilityId가 없으면
           * title과 catalog label 비교
           */
          if (
            !vulnerability &&
            sourceAnswer.title
          ) {

            vulnerability =
              SECURITY_VULNERABILITIES
                .find(
                  item =>
                    item.label ===
                    sourceAnswer.title
                );
          }


          if (
            !vulnerability
          ) {

            return null;
          }


          return {

            ...sourceAnswer,

            id:
              index +
              1,

            vulnerabilityId:
              vulnerability.id,

            title:
              vulnerability.label,

            hint:
              sourceAnswer.hint ||
              '',

            explanation:
              sourceAnswer
                .explanation ||
              vulnerability
                .description ||
              '',
          };
        }
      )
      .filter(
        (
          answer
        ):
          answer is SecurityAnswer =>
            Boolean(
              answer
            )
      );
  };


/* =========================================================
   대표 정답 1개 가져오기

   - 4지선다 정답 유형
   - 힌트
   - 결과 화면

   등에 사용할 대표값으로 첫 번째 위치 사용
========================================================= */

const getQuestionAnswer =
  (
    question:
      Question
  ):
    SecurityAnswer |
    null => {

    return (
      getQuestionAnswers(
        question
      )[0] ||
      null
    );
  };


/* =========================================================
   플레이 가능한 Question 변환
========================================================= */

const normalizePlayableQuestion =
  (
    question:
      Question
  ):
    Question |
    null => {

    const normalizedAnswers =
      getQuestionAnswers(
        question
      );


    const answer =
      normalizedAnswers[0] ||
      null;


    if (
      !answer ||
      !answer.vulnerabilityId ||
      normalizedAnswers.length ===
        0
    ) {

      return null;
    }


    return {

      ...question,

      /*
       * 기존 코드 호환을 위한 대표 정답
       */
      answer,

      /*
       * 실제 게임 클릭 판정에 사용하는
       * 모든 정답 인정 위치
       */
      answers:
        normalizedAnswers,

      /*
       * API에서 없으면 빈 배열
       */
      excludedChoiceIds:
        Array.isArray(
          question.excludedChoiceIds
        )
          ? question.excludedChoiceIds
          : [],
    };
  };


/* =========================================================
   GamePage
========================================================= */

export const GamePage:
React.FC = () => {

  /* =========================================================
     Base Data
  ========================================================= */

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


  /*
   * 관리자에서 활성화된 전체 문제
   */
  const [
    activeQuestions,
    setActiveQuestions,
  ] =
    useState<Question[]>(
      []
    );


  /*
   * 이번 게임에서 랜덤 선택된 3문제
   */
  const [
    gameQuestions,
    setGameQuestions,
  ] =
    useState<Question[]>(
      []
    );


  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] =
    useState<number>(
      0
    );


  const currentQuestion =
    gameQuestions[
      currentQuestionIndex
    ] ||
    null;


  const currentAnswers =
    currentQuestion
      ? getQuestionAnswers(
          currentQuestion
        )
      : [];


  /*
   * 4지선다 / 힌트 / 결과 화면에 사용할 대표 정답
   */
  const currentAnswer =
    currentAnswers[0] ||
    null;


  /* =========================================================
     Image Sources
  ========================================================= */

  const [
    imageSources,
    setImageSources,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {}
    );


  const currentImageSrc =
    currentQuestion
      ? (
          imageSources[
            currentQuestion.id
          ] ||
          ''
        )
      : '';


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
     Global Game State
  ========================================================= */

  const [
    timeLeft,
    setTimeLeft,
  ] =
    useState<number>(
      GAME_TIME_LIMIT
    );


  const [
    lives,
    setLives,
  ] =
    useState<number>(
      GAME_LIVES
    );


  const [
    hintCount,
    setHintCount,
  ] =
    useState<number>(
      1
    );


  const [
    completedQuestionIds,
    setCompletedQuestionIds,
  ] =
    useState<string[]>(
      []
    );


  const [
    locationFound,
    setLocationFound,
  ] =
    useState<boolean>(
      false
    );


  /* =========================================================
     4지선다
  ========================================================= */

  const [
    choiceOptions,
    setChoiceOptions,
  ] =
    useState<
      SecurityVulnerability[]
    >(
      []
    );


  const [
    wrongChoiceId,
    setWrongChoiceId,
  ] =
    useState<string | null>(
      null
    );


  /* =========================================================
     Correct Feedback
  ========================================================= */

  const [
    activeExplanation,
    setActiveExplanation,
  ] =
    useState<{
      title:
        string;

      text:
        string;
    } | null>(
      null
    );


  /* =========================================================
     Hint
  ========================================================= */

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


  /* =========================================================
     Sound
  ========================================================= */

  const [
    isMuted,
    setIsMuted,
  ] =
    useState<boolean>(
      !soundManager
        .isEnabled()
    );


  /* =========================================================
     Result
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
      ReturnType<
        typeof setInterval
      > |
      null
    >(
      null
    );


  const transitionTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > |
      null
    >(
      null
    );


  const wrongChoiceTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > |
      null
    >(
      null
    );


  const isFinishedRef =
    useRef<boolean>(
      false
    );


  const timeLeftRef =
    useRef<number>(
      GAME_TIME_LIMIT
    );


  /* =========================================================
     timeLeft Ref 동기화
  ========================================================= */

  useEffect(
    () => {

      timeLeftRef.current =
        timeLeft;

    },
    [
      timeLeft,
    ]
  );


  /* =========================================================
     Image Preload
  ========================================================= */

  const preloadSingleImage =
    useCallback(
      (
        src:
          string
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
        ),
      []
    );


  /* =========================================================
     랜덤 3문제 준비
  ========================================================= */

  const prepareGameSet =
    useCallback(
      async (
        sourceQuestions:
          Question[],

        gameConfig:
          GameConfig
      ) => {

        const playable =
          sourceQuestions
            .map(
              normalizePlayableQuestion
            )
            .filter(
              (
                question
              ):
                question is Question =>
                  Boolean(
                    question
                  )
            );


        /*
         * 최소 3개 필요
         */
        if (
          playable.length <
          QUESTIONS_PER_GAME
        ) {

          setGameQuestions(
            []
          );


          setImageSources(
            {}
          );


          setPlayState(
            'EMPTY'
          );


          return false;
        }


        /*
         * 활성 문제 중 랜덤 3개
         */
        const selected =
          pickRandomItems(
            playable,
            gameConfig
              .questionsPerGame ||
              QUESTIONS_PER_GAME
          )
            .slice(
              0,
              QUESTIONS_PER_GAME
            );


        setIsLoadingImages(
          true
        );


        setImageLoadError(
          false
        );


        try {

          /*
           * 출제할 이미지 3장 미리 조회
           */
          const results =
            await Promise.all(
              selected.map(
                async question => {

                  const result =
                    await resolveQuestionImage(
                      question
                    );


                  if (
                    !result.success ||
                    !result.data
                  ) {

                    throw new Error(
                      result.error ||
                      '문제 이미지를 불러오지 못했습니다.'
                    );
                  }


                  const src =
                    result.data
                      .imageSrc;


                  await preloadSingleImage(
                    src
                  );


                  return {

                    id:
                      question.id,

                    src,
                  };
                }
              )
            );


          const sourceMap:
            Record<
              string,
              string
            > = {};


          results.forEach(
            result => {

              sourceMap[
                result.id
              ] =
                result.src;
            }
          );


          setImageSources(
            sourceMap
          );


          setGameQuestions(
            selected
          );


          setCurrentQuestionIndex(
            0
          );


          /*
           * 게임 전체 State 초기화
           */
          setTimeLeft(
            GAME_TIME_LIMIT
          );


          timeLeftRef.current =
            GAME_TIME_LIMIT;


          setLives(
            GAME_LIVES
          );


          setHintCount(
            gameConfig
              .defaultHintCount ??
              1
          );


          setCompletedQuestionIds(
            []
          );


          setLocationFound(
            false
          );


          setChoiceOptions(
            []
          );


          setWrongChoiceId(
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


          setIsSuccess(
            false
          );


          setFailReason(
            null
          );


          isFinishedRef.current =
            false;


          setIsLoadingImages(
            false
          );


          return true;

        } catch (error) {

          console.error(
            '게임 이미지 준비 오류:',
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
        preloadSingleImage,
      ]
    );


  /* =========================================================
     Load Config + Questions
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
            configResult,
            questionResult,
          ] =
            await Promise.all([
              getConfig(),
              getQuestions(),
            ]);


          const loadedConfig =
            (
              configResult
                .success &&

              configResult
                .data
            )
              ? configResult.data
              : {
                  ...DEFAULT_CONFIG,

                  questionsPerGame:
                    QUESTIONS_PER_GAME,
                };


          setConfig(
            loadedConfig
          );


          if (
            !questionResult.success
          ) {

            setErrorMessage(
              questionResult.error ||
              '게임 데이터를 불러오지 못했습니다.'
            );


            setPlayState(
              'ERROR'
            );


            return;
          }


          const allQuestions =
            questionResult.data ||
            [];


          const active =
            allQuestions
              .filter(
                question =>
                  question.active
              );


          /*
           * answer + vulnerabilityId가 있는 문제만
           */
          const playable =
            active
              .map(
                normalizePlayableQuestion
              )
              .filter(
                (
                  question
                ):
                  question is Question =>
                    Boolean(
                      question
                    )
              );


          setActiveQuestions(
            playable
          );


          if (
            playable.length <
            QUESTIONS_PER_GAME
          ) {

            setPlayState(
              'EMPTY'
            );


            return;
          }


          const prepared =
            await prepareGameSet(
              playable,
              loadedConfig
            );


          if (
            prepared
          ) {

            setPlayState(
              'START'
            );
          }

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
        prepareGameSet,
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
     Finish Game
  ========================================================= */

  const finishGame =
    useCallback(
      (
        success:
          boolean,

        reason:
          'TIME_OUT' |
          'NO_LIVES' |
          null
      ) => {

        if (
          isFinishedRef.current
        ) {

          return;
        }


        isFinishedRef.current =
          true;


        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );


          timerRef.current =
            null;
        }


        const spent =
          GAME_TIME_LIMIT -
          timeLeftRef.current;


        setTimeSpent(
          Math.max(
            0,
            Math.min(
              GAME_TIME_LIMIT,
              spent
            )
          )
        );


        setIsSuccess(
          success
        );


        setFailReason(
          reason
        );


        if (
          success
        ) {

          soundManager
            .playVictory();

        } else {

          soundManager
            .playGameOver();
        }


        setPlayState(
          'RESULT'
        );
      },
      []
    );


  /* =========================================================
     Global 60s Timer
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
              previous => {

                if (
                  previous <=
                  1
                ) {

                  timeLeftRef.current =
                    0;


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


                    setTimeSpent(
                      GAME_TIME_LIMIT
                    );


                    setIsSuccess(
                      false
                    );


                    setFailReason(
                      'TIME_OUT'
                    );


                    soundManager
                      .playGameOver();


                    setPlayState(
                      'RESULT'
                    );
                  }


                  return 0;
                }


                const next =
                  previous -
                  1;


                timeLeftRef.current =
                  next;


                return next;
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
    ]
  );


  /* =========================================================
     Cleanup
  ========================================================= */

  useEffect(
    () => {

      return () => {

        if (
          timerRef.current
        ) {

          clearInterval(
            timerRef.current
          );
        }


        if (
          transitionTimeoutRef.current
        ) {

          clearTimeout(
            transitionTimeoutRef.current
          );
        }


        if (
          wrongChoiceTimeoutRef.current
        ) {

          clearTimeout(
            wrongChoiceTimeoutRef.current
          );
        }
      };

    },
    []
  );


  /* =========================================================
     기회 차감
  ========================================================= */

  const consumeLife =
    useCallback(
      () => {

        if (
          isFinishedRef.current
        ) {

          return;
        }


        soundManager
          .playWrong();


        setLives(
          previous => {

            const next =
              previous -
              1;


            if (
              next <=
              0
            ) {

              window.setTimeout(
                () => {

                  finishGame(
                    false,
                    'NO_LIVES'
                  );

                },
                250
              );


              return 0;
            }


            return next;
          }
        );
      },
      [
        finishGame,
      ]
    );


  /* =========================================================
     1단계
     사진에서 올바른 위치 클릭

     ★ 핵심 수정:
     currentQuestion.excludedChoiceIds 반영
  ========================================================= */

  const handleLocationFound =
    (
      answer:
        SecurityAnswer
    ) => {

      if (
        isFinishedRef.current ||
        locationFound ||
        !currentQuestion ||
        !answer
          .vulnerabilityId
      ) {

        return;
      }


      /*
       * 위치만 맞은 상태
       * 아직 문제 완료는 아님
       */
      soundManager
        .playClick();


      setLocationFound(
        true
      );


      /*
       * =====================================================
       * 4지선다 생성
       *
       * 1. 실제 정답 1개
       * 2. 관리자 제외 목록 제거
       * 3. 남은 후보 중 랜덤 오답 3개
       * 4. 최종 순서 Shuffle
       * =====================================================
       */
      const choices =
        createVulnerabilityChoices(
          answer.vulnerabilityId,
          4,
          currentQuestion
            .excludedChoiceIds ||
            []
        );


      /*
       * 정상적으로는 QuestionEditor에서
       * 오답 후보가 3개 미만이 되지 않도록 막지만,
       * 과거 데이터 등 예외상황도 방어
       */
      if (
        choices.length <
        4
      ) {

        console.error(
          '4지선다 생성 실패:',
          {
            questionId:
              currentQuestion.id,

            correctId:
              answer.vulnerabilityId,

            excludedChoiceIds:
              currentQuestion
                .excludedChoiceIds ||
              [],

            choices,
          }
        );


        setErrorMessage(
          '이 문제의 4지선다를 생성할 수 없습니다. 관리자에서 제외 항목 설정을 확인해주세요.'
        );


        return;
      }


      setChoiceOptions(
        choices
      );
    };


  /* =========================================================
     사진 위치 오답
  ========================================================= */

  const handleWrongLocation =
    () => {

      if (
        isFinishedRef.current ||
        locationFound
      ) {

        return;
      }


      consumeLife();
    };


  /* =========================================================
     다음 문제 이동
  ========================================================= */

  const moveToNextQuestion =
    (
      completedIds:
        string[]
    ) => {

      const isLast =
        currentQuestionIndex >=
        gameQuestions.length -
          1;


      /*
       * 마지막 문제
       */
      if (
        isLast
      ) {

        transitionTimeoutRef.current =
          setTimeout(
            () => {

              setActiveExplanation(
                null
              );


              finishGame(
                true,
                null
              );

            },
            CORRECT_FEEDBACK_TIME
          );


        return;
      }


      /*
       * 다음 문제
       */
      transitionTimeoutRef.current =
        setTimeout(
          () => {

            setActiveExplanation(
              null
            );


            setChoiceOptions(
              []
            );


            setWrongChoiceId(
              null
            );


            setLocationFound(
              false
            );


            setCurrentQuestionIndex(
              previous =>
                previous +
                1
            );


            void completedIds;

          },
          CORRECT_FEEDBACK_TIME
        );
    };


  /* =========================================================
     2단계:
     4지선다 선택
  ========================================================= */

  const handleChoiceSelect =
    (
      choice:
        SecurityVulnerability
    ) => {

      if (
        isFinishedRef.current ||
        !currentQuestion ||
        !currentAnswer ||
        !currentAnswer
          .vulnerabilityId ||
        activeExplanation
      ) {

        return;
      }


      /* -------------------------------------------------------
         정답
      ------------------------------------------------------- */

      if (
        choice.id ===
        currentAnswer
          .vulnerabilityId
      ) {

        soundManager
          .playCorrect();


        const nextCompleted = [
          ...completedQuestionIds,
          currentQuestion.id,
        ];


        setCompletedQuestionIds(
          nextCompleted
        );


        setChoiceOptions(
          []
        );


        setWrongChoiceId(
          null
        );


        /*
         * 위치 + 취약점 종류를 모두 맞힌 후에만
         * 최종 정답으로 인정
         */
        setActiveExplanation({

          title:
            choice.label,

          text:
            choice.description,
        });


        moveToNextQuestion(
          nextCompleted
        );


        return;
      }


      /* -------------------------------------------------------
         오답
      ------------------------------------------------------- */

      setWrongChoiceId(
        choice.id
      );


      consumeLife();


      if (
        wrongChoiceTimeoutRef.current
      ) {

        clearTimeout(
          wrongChoiceTimeoutRef.current
        );
      }


      wrongChoiceTimeoutRef.current =
        setTimeout(
          () => {

            setWrongChoiceId(
              null
            );

          },
          WRONG_CHOICE_FEEDBACK_TIME
        );
    };


  /* =========================================================
     Hint
  ========================================================= */

  const handleUseHint =
    () => {

      if (
        hintCount <=
          0 ||

        !currentAnswer ||

        isFinishedRef.current ||

        activeExplanation
      ) {

        return;
      }


      soundManager
        .playClick();


      /*
       * 위치 찾기 단계
       */
      if (
        !locationFound
      ) {

        setCurrentHintText(
          currentAnswer.hint ||
          '사진 속에서 개인정보나 계정정보가 부적절하게 노출되거나 방치된 부분을 살펴보세요.'
        );

      } else {

        /*
         * 4지선다 단계에서는
         * 정답을 직접 알려주지 않음
         */
        setCurrentHintText(
          '선택지를 천천히 읽고, 방금 찾은 장면이 어떤 정보보호 위반에 해당하는지 생각해보세요.'
        );
      }


      setHintCount(
        previous =>
          Math.max(
            0,
            previous -
            1
          )
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
        soundManager
          .toggle();


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
        activeQuestions.length <
        QUESTIONS_PER_GAME
      ) {

        setPlayState(
          'EMPTY'
        );


        return;
      }


      setPlayState(
        'LOADING'
      );


      const prepared =
        await prepareGameSet(
          activeQuestions,
          config
        );


      if (
        prepared
      ) {

        setPlayState(
          'PLAYING'
        );
      }
    };


  /* =========================================================
     Demo
  ========================================================= */

  const handleDemo =
    async () => {

      const demoConfig:
        GameConfig = {

          ...DEFAULT_CONFIG,

          defaultTimeLimit:
            GAME_TIME_LIMIT,

          defaultLives:
            GAME_LIVES,

          questionsPerGame:
            QUESTIONS_PER_GAME,
        };


      setConfig(
        demoConfig
      );


      setActiveQuestions(
        DEMO_QUESTIONS
      );


      setPlayState(
        'LOADING'
      );


      const prepared =
        await prepareGameSet(
          DEMO_QUESTIONS,
          demoConfig
        );


      if (
        prepared
      ) {

        setPlayState(
          'START'
        );
      }
    };


  /* =========================================================
     결과 화면용 Answer 배열
  ========================================================= */

  const allGameAnswers:
    SecurityAnswer[] =
      gameQuestions
        .map(
          question =>
            getQuestionAnswer(
              question
            )
        )
        .filter(
          (
            answer
          ):
            answer is SecurityAnswer =>
              Boolean(
                answer
              )
        );


  const foundGameAnswers:
    SecurityAnswer[] =
      gameQuestions
        .filter(
          question =>
            completedQuestionIds
              .includes(
                question.id
              )
        )
        .map(
          question =>
            getQuestionAnswer(
              question
            )
        )
        .filter(
          (
            answer
          ):
            answer is SecurityAnswer =>
              Boolean(
                answer
              )
        );


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

              정보보호 캠페인

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
              출제할 보안 취약점 사진 3장을 준비하는 중입니다...
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
              p-8
              text-center
            "
          >

            <AlertCircle
              className="
                w-12
                h-12
                text-rose-500
                mx-auto
                mb-4
              "
            />


            <h2
              className="
                text-xl
                font-black
                mb-2
              "
            >
              데이터를 불러오지 못했습니다.
            </h2>


            <p
              className="
                text-sm
                text-slate-500
                mb-6
              "
            >
              {errorMessage}
            </p>


            <div
              className="
                flex
                justify-center
                gap-2
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
                  rounded-xl
                  text-sm
                  font-bold
                  flex
                  items-center
                  gap-2
                "
              >

                <RefreshCw
                  className="
                    w-4
                    h-4
                  "
                />

                다시 시도

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
                  text-white
                  rounded-xl
                  text-sm
                  font-bold
                "
              >
                기본 문제 체험
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
              max-w-lg
              bg-white
              rounded-3xl
              border
              border-sky-100
              shadow-xl
              p-8
              text-center
            "
          >

            <Sparkles
              className="
                w-12
                h-12
                text-blue-600
                mx-auto
                mb-4
              "
            />


            <h2
              className="
                text-xl
                font-black
                text-slate-900
                mb-2
              "
            >
              출제 가능한 문제가 부족합니다.
            </h2>


            <p
              className="
                text-sm
                text-slate-500
                leading-relaxed
                mb-6
              "
            >
              새로운 방식의 게임을 진행하려면
              정답 취약점과 위치가 등록된 활성 문제가
              최소 3개 이상 필요합니다.
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
                  text-white
                  text-sm
                  font-bold
                  rounded-xl
                "
              >
                기본 문제 체험
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
        gameQuestions.length >
          0 && (

        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            p-4
          "
        >

          <StartScreen
            gameTitle={
              config.gameTitle
            }

            totalRisksCount={
              gameQuestions.length
            }

            timeLimit={
              GAME_TIME_LIMIT
            }

            lives={
              GAME_LIVES
            }

            hintCount={
              hintCount
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
              void prepareGameSet(
                activeQuestions,
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
        currentQuestion &&
        currentAnswer && (

        <div
          className="
            flex-1
            flex
            flex-col
            h-screen
            overflow-hidden
            bg-white
            relative
          "
        >

          {/* =================================================
              HUD
          ================================================= */}

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
              GAME_LIVES
            }

            foundCount={
              completedQuestionIds.length
            }

            totalAnswers={
              gameQuestions.length
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


          {/* =================================================
              현재 문제 번호
          ================================================= */}

          <div
            className="
              absolute
              top-[72px]
              sm:top-[76px]
              left-1/2
              -translate-x-1/2
              z-20
              pointer-events-none
            "
          >

            <div
              className="
                px-4
                py-1.5
                rounded-full
                bg-white/95
                backdrop-blur
                border
                border-sky-100
                shadow-sm
                text-xs
                sm:text-sm
                font-black
                text-blue-700
              "
            >
              문제 {currentQuestionIndex + 1}
              {' / '}
              {gameQuestions.length}
            </div>

          </div>


          {/* =================================================
              취약점 이미지
          ================================================= */}

          <ImageComparison
            imageUrl={
              currentImageSrc
            }

            answers={
              currentAnswers
            }

            locationFound={
              locationFound
            }

            onLocationFound={
              handleLocationFound
            }

            onWrongClick={
              handleWrongLocation
            }

            isLocked={
              isFinishedRef.current ||
              Boolean(
                activeExplanation
              ) ||
              locationFound
            }
          />


          {/* =================================================
              4지선다
          ================================================= */}

          {locationFound &&
            choiceOptions.length >
              0 &&
            !activeExplanation && (

            <div
              className="
                fixed
                inset-0
                z-50
                bg-slate-900/20
                backdrop-blur-[2px]
                flex
                items-center
                justify-center
                p-4
              "
            >

              <div
                className="
                  w-full
                  max-w-3xl
                  bg-white
                  rounded-3xl
                  shadow-2xl
                  border
                  border-sky-100
                  p-5
                  sm:p-7
                  md:p-8
                "
              >

                <div
                  className="
                    text-center
                    mb-6
                  "
                >

                  <div
                    className="
                      inline-flex
                      items-center
                      px-3
                      py-1
                      rounded-full
                      bg-blue-50
                      text-blue-700
                      text-xs
                      font-black
                      mb-3
                    "
                  >
                    위치 발견!
                  </div>


                  <h2
                    className="
                      text-xl
                      sm:text-2xl
                      md:text-3xl
                      font-black
                      text-slate-900
                    "
                  >
                    어떤 보안 취약점에 해당할까요?
                  </h2>


                  <p
                    className="
                      text-sm
                      text-slate-500
                      mt-2
                    "
                  >
                    아래 4개 중 가장 알맞은 항목을 선택해주세요.
                  </p>

                </div>


                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-3
                  "
                >

                  {choiceOptions.map(
                    (
                      choice,
                      index
                    ) => {

                      const isWrong =
                        wrongChoiceId ===
                        choice.id;


                      return (

                        <button
                          key={
                            choice.id
                          }
                          type="button"
                          onClick={() =>
                            handleChoiceSelect(
                              choice
                            )
                          }
                          className={`
                            min-h-[76px]
                            sm:min-h-[88px]
                            px-4
                            py-4
                            rounded-2xl
                            border-2
                            text-left
                            transition-all
                            flex
                            items-center
                            gap-3
                            ${
                              isWrong
                                ? `
                                  bg-rose-50
                                  border-rose-400
                                  text-rose-800
                                  scale-[0.99]
                                `
                                : `
                                  bg-white
                                  border-slate-200
                                  hover:border-blue-400
                                  hover:bg-blue-50/50
                                  text-slate-800
                                  hover:-translate-y-0.5
                                  hover:shadow-md
                                `
                            }
                          `}
                        >

                          <div
                            className={`
                              w-8
                              h-8
                              rounded-full
                              shrink-0
                              flex
                              items-center
                              justify-center
                              text-sm
                              font-black
                              ${
                                isWrong
                                  ? `
                                    bg-rose-100
                                    text-rose-600
                                  `
                                  : `
                                    bg-blue-50
                                    text-blue-700
                                  `
                              }
                            `}
                          >

                            {
                              isWrong
                                ? (
                                  <XCircle
                                    className="
                                      w-5
                                      h-5
                                    "
                                  />
                                )
                                : (
                                  index +
                                  1
                                )
                            }

                          </div>


                          <span
                            className="
                              text-sm
                              sm:text-base
                              font-bold
                              leading-snug
                            "
                          >
                            {choice.label}
                          </span>

                        </button>

                      );
                    }
                  )}

                </div>


                <div
                  className="
                    mt-5
                    text-center
                    text-xs
                    text-slate-400
                  "
                >
                  틀린 선택지는 기회가 1회 차감됩니다.
                </div>

              </div>

            </div>
          )}


          {/* =================================================
              4지선다 생성 오류
          ================================================= */}

          {locationFound &&
            choiceOptions.length ===
              0 &&
            errorMessage && (

            <div
              className="
                fixed
                inset-0
                z-50
                bg-slate-900/20
                backdrop-blur-[2px]
                flex
                items-center
                justify-center
                p-4
              "
            >

              <div
                className="
                  w-full
                  max-w-lg
                  bg-white
                  rounded-3xl
                  border
                  border-rose-200
                  shadow-2xl
                  p-7
                  text-center
                "
              >

                <AlertCircle
                  className="
                    w-10
                    h-10
                    text-rose-500
                    mx-auto
                    mb-3
                  "
                />


                <h3
                  className="
                    text-lg
                    font-black
                    text-slate-900
                    mb-2
                  "
                >
                  선택지를 만들 수 없습니다.
                </h3>


                <p
                  className="
                    text-sm
                    text-slate-600
                    leading-relaxed
                  "
                >
                  {errorMessage}
                </p>


                <button
                  type="button"
                  onClick={() =>
                    void loadGameData()
                  }
                  className="
                    mt-5
                    px-5
                    py-2.5
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    font-bold
                    rounded-xl
                  "
                >
                  게임 다시 불러오기
                </button>

              </div>

            </div>
          )}


          {/* =================================================
              최종 정답 피드백
          ================================================= */}

          {activeExplanation && (

            <div
              className="
                fixed
                inset-0
                z-[60]
                bg-slate-900/15
                backdrop-blur-[2px]
                flex
                items-center
                justify-center
                p-4
              "
            >

              <div
                className="
                  w-full
                  max-w-2xl
                  bg-white
                  rounded-3xl
                  border-2
                  border-emerald-200
                  shadow-2xl
                  p-6
                  sm:p-8
                  text-center
                "
              >

                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-emerald-50
                    border
                    border-emerald-200
                    text-emerald-600
                    flex
                    items-center
                    justify-center
                    mx-auto
                    mb-4
                  "
                >

                  <CheckCircle2
                    className="
                      w-7
                      h-7
                    "
                  />

                </div>


                <div
                  className="
                    text-sm
                    font-black
                    text-emerald-600
                    mb-2
                  "
                >
                  정답입니다!
                </div>


                <h3
                  className="
                    text-2xl
                    sm:text-3xl
                    font-black
                    text-slate-900
                    mb-3
                  "
                >
                  {activeExplanation.title}
                </h3>


                <p
                  className="
                    text-sm
                    sm:text-base
                    text-slate-600
                    leading-relaxed
                  "
                >
                  {activeExplanation.text}
                </p>

              </div>

            </div>
          )}


          {/* =================================================
              Hint
          ================================================= */}

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
        gameQuestions.length >
          0 && (

        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            p-4
          "
        >

          <ResultScreen
            isSuccess={
              isSuccess
            }

            foundAnswers={
              foundGameAnswers
            }

            allAnswers={
              allGameAnswers
            }

            livesLeft={
              lives
            }

            maxLives={
              GAME_LIVES
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