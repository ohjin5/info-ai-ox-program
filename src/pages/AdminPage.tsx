import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  getQuestions,
  saveQuestion,
  deleteQuestion,
  toggleQuestion,
  verifyAdminPassword,
  getDriveImageDataUrl,
  type Question,
  type SaveQuestionPayload,
} from '../services/apiService';

import {
  getSecurityVulnerabilityById,
} from '../constants/securityVulnerabilities';

import {
  AdminLogin,
} from '../components/AdminLogin';

import {
  QuestionEditor,
} from '../components/QuestionEditor';

import {
  ArrowLeft,
  Plus,
  RefreshCw,
  LogOut,
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  AlertCircle,
  ImageIcon,
  Target,
} from 'lucide-react';


/* =========================================================
   관리자 문제 목록 썸네일

   우선순위:
   1. 신규 imageId
   2. 기존 riskImageId
   3. 신규 imageUrl
   4. 기존 riskImageUrl
========================================================= */

interface AdminThumbnailProps {

  fileId?: string;

  fallbackUrl?: string;

  alt: string;
}


const AdminThumbnail:
React.FC<AdminThumbnailProps> = ({

  fileId,

  fallbackUrl,

  alt,

}) => {

  const [
    src,
    setSrc,
  ] =
    useState<string>(
      ''
    );


  const [
    isLoading,
    setIsLoading,
  ] =
    useState<boolean>(
      true
    );


  const [
    hasError,
    setHasError,
  ] =
    useState<boolean>(
      false
    );


  useEffect(
    () => {

      let cancelled =
        false;


      const loadImage =
        async () => {

          setSrc(
            ''
          );


          setIsLoading(
            true
          );


          setHasError(
            false
          );


          /* -----------------------------------------------
             Drive
          ----------------------------------------------- */

          if (
            fileId
          ) {

            try {

              const result =
                await getDriveImageDataUrl(
                  fileId
                );


              if (
                cancelled
              ) {

                return;
              }


              if (
                result.success &&
                result.data
              ) {

                setSrc(
                  result.data
                );


                setIsLoading(
                  false
                );


                return;
              }


              console.warn(
                '관리자 썸네일 조회 실패:',
                result.error
              );

            } catch (error) {

              console.error(
                '관리자 썸네일 조회 오류:',
                error
              );
            }
          }


          /* -----------------------------------------------
             URL Fallback
          ----------------------------------------------- */

          if (
            fallbackUrl
          ) {

            if (
              !cancelled
            ) {

              setSrc(
                fallbackUrl
              );


              setIsLoading(
                false
              );
            }


            return;
          }


          if (
            !cancelled
          ) {

            setHasError(
              true
            );


            setIsLoading(
              false
            );
          }
        };


      void loadImage();


      return () => {

        cancelled =
          true;
      };

    },
    [
      fileId,
      fallbackUrl,
    ]
  );


  if (
    isLoading
  ) {

    return (

      <div
        className="
          w-full
          h-full
          flex
          items-center
          justify-center
          bg-slate-100
        "
      >

        <div
          className="
            w-5
            h-5
            border-2
            border-slate-300
            border-t-blue-600
            rounded-full
            animate-spin
          "
        />

      </div>
    );
  }


  if (
    hasError ||
    !src
  ) {

    return (

      <div
        className="
          w-full
          h-full
          flex
          flex-col
          items-center
          justify-center
          gap-1
          bg-slate-100
          text-slate-400
        "
      >

        <ImageIcon
          className="
            w-5
            h-5
          "
        />

        <span
          className="
            text-[10px]
            font-semibold
          "
        >
          이미지 없음
        </span>

      </div>
    );
  }


  return (

    <img
      src={
        src
      }
      alt={
        alt
      }
      className="
        w-full
        h-full
        object-cover
      "
      onError={() => {

        setHasError(
          true
        );
      }}
    />
  );
};


/* =========================================================
   Question → 취약점 표시명
========================================================= */

const getQuestionVulnerabilityLabel =
  (
    question:
      Question
  ):
    string => {

    const answer =
      question.answer ||
      question.answers?.[0];


    if (
      !answer
    ) {

      return '정답 미등록';
    }


    if (
      answer.vulnerabilityId
    ) {

      return (
        getSecurityVulnerabilityById(
          answer.vulnerabilityId
        )?.label ||
        answer.title ||
        '취약점'
      );
    }


    return (
      answer.title ||
      '취약점'
    );
  };


/* =========================================================
   Admin Page
========================================================= */

export const AdminPage:
React.FC = () => {


  /* =========================================================
     관리자 인증
  ========================================================= */

  const [
    adminPassword,
    setAdminPassword,
  ] =
    useState<string>(
      ''
    );


  const [
    isAuthenticated,
    setIsAuthenticated,
  ] =
    useState<boolean>(
      false
    );


  const [
    loginError,
    setLoginError,
  ] =
    useState<string | null>(
      null
    );


  const [
    isVerifyingLogin,
    setIsVerifyingLogin,
  ] =
    useState<boolean>(
      false
    );


  const [
    isCheckingSession,
    setIsCheckingSession,
  ] =
    useState<boolean>(
      true
    );


  /* =========================================================
     문제 목록
  ========================================================= */

  const [
    questions,
    setQuestions,
  ] =
    useState<Question[]>(
      []
    );


  const [
    isLoading,
    setIsLoading,
  ] =
    useState<boolean>(
      false
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  /* =========================================================
     선택 상태
  ========================================================= */

  const [
    selectedQuestionId,
    setSelectedQuestionId,
  ] =
    useState<string | null>(
      null
    );


  const [
    isCreatingNew,
    setIsCreatingNew,
  ] =
    useState<boolean>(
      false
    );


  const [
    deleteConfirmId,
    setDeleteConfirmId,
  ] =
    useState<string | null>(
      null
    );


  /* =========================================================
     통계
  ========================================================= */

  const activeCount =
    questions.filter(
      question =>
        question.active
    ).length;


  const isGameReady =
    activeCount >=
    3;


  /* =========================================================
     기존 세션 재인증
  ========================================================= */

  useEffect(
    () => {

      const verifyExistingSession =
        async () => {

          const savedPassword =
            sessionStorage
              .getItem(
                'hospital_admin_pw'
              );


          if (
            !savedPassword
          ) {

            setIsCheckingSession(
              false
            );


            return;
          }


          try {

            const response =
              await verifyAdminPassword(
                savedPassword
              );


            if (
              response.success ===
                true &&

              response.authenticated ===
                true
            ) {

              setAdminPassword(
                savedPassword
              );


              setIsAuthenticated(
                true
              );

            } else {

              sessionStorage
                .removeItem(
                  'hospital_admin_pw'
                );


              setAdminPassword(
                ''
              );


              setIsAuthenticated(
                false
              );
            }

          } catch (error) {

            console.error(
              '기존 관리자 세션 검증 오류:',
              error
            );


            sessionStorage
              .removeItem(
                'hospital_admin_pw'
              );


            setAdminPassword(
              ''
            );


            setIsAuthenticated(
              false
            );

          } finally {

            setIsCheckingSession(
              false
            );
          }
        };


      void verifyExistingSession();

    },
    []
  );


  /* =========================================================
     문제 목록 조회
  ========================================================= */

  const fetchQuestions =
    useCallback(
      async () => {

        setIsLoading(
          true
        );


        setError(
          null
        );


        try {

          const response =
            await getQuestions();


          if (
            response.success &&
            response.data
          ) {

            setQuestions(
              response.data
            );


            /*
             * 현재 선택값이 없을 때만
             * 첫 번째 문제 선택
             */
            if (
              response.data.length >
                0 &&

              !selectedQuestionId &&

              !isCreatingNew
            ) {

              setSelectedQuestionId(
                response.data[0].id
              );
            }

          } else {

            setError(
              response.error ||
              '문제 목록을 불러오지 못했습니다.'
            );
          }

        } catch (error) {

          console.warn(
            'Failed to fetch questions:',
            error
          );


          setError(
            '서버 연결 중 오류가 발생했습니다.'
          );

        } finally {

          setIsLoading(
            false
          );
        }

      },
      [
        selectedQuestionId,
        isCreatingNew,
      ]
    );


  /* =========================================================
     인증 완료 후 목록
  ========================================================= */

  useEffect(
    () => {

      if (
        isAuthenticated
      ) {

        void fetchQuestions();
      }

    },
    [
      isAuthenticated,
      fetchQuestions,
    ]
  );


  /* =========================================================
     Login
  ========================================================= */

  const handleLogin =
    async (
      pw:
        string
    ) => {

      const password =
        pw.trim();


      if (
        !password
      ) {

        setLoginError(
          '관리자 비밀번호를 입력해주세요.'
        );


        return;
      }


      setIsVerifyingLogin(
        true
      );


      setLoginError(
        null
      );


      try {

        const response =
          await verifyAdminPassword(
            password
          );


        if (
          !response.success ||
          response.authenticated !==
            true
        ) {

          setLoginError(
            response.error ||
            '관리자 비밀번호가 올바르지 않습니다.'
          );


          setAdminPassword(
            ''
          );


          setIsAuthenticated(
            false
          );


          sessionStorage
            .removeItem(
              'hospital_admin_pw'
            );


          return;
        }


        sessionStorage
          .setItem(
            'hospital_admin_pw',
            password
          );


        setAdminPassword(
          password
        );


        setIsAuthenticated(
          true
        );

      } catch (error) {

        console.error(
          '관리자 로그인 오류:',
          error
        );


        setLoginError(
          '관리자 인증 서버에 연결할 수 없습니다.'
        );


        setAdminPassword(
          ''
        );


        setIsAuthenticated(
          false
        );


        sessionStorage
          .removeItem(
            'hospital_admin_pw'
          );

      } finally {

        setIsVerifyingLogin(
          false
        );
      }
    };


  /* =========================================================
     Logout
  ========================================================= */

  const handleLogout =
    () => {

      sessionStorage
        .removeItem(
          'hospital_admin_pw'
        );


      setAdminPassword(
        ''
      );


      setIsAuthenticated(
        false
      );


      setQuestions(
        []
      );


      setSelectedQuestionId(
        null
      );


      setIsCreatingNew(
        false
      );


      setLoginError(
        null
      );
    };


  /* =========================================================
     Toggle
  ========================================================= */

  const handleToggleActive =
    async (
      id:
        string,

      nextActive:
        boolean
    ) => {

      try {

        /*
         * UI 우선 반영
         */
        setQuestions(
          previous =>
            previous.map(
              question =>
                question.id ===
                  id
                  ? {
                      ...question,

                      active:
                        nextActive,
                    }
                  : question
            )
        );


        const response =
          await toggleQuestion(
            id,
            nextActive,
            adminPassword
          );


        if (
          !response.success
        ) {

          alert(
            response.error ||
            '상태 변경에 실패했습니다. 관리자 암호를 확인하세요.'
          );


          await fetchQuestions();
        }

      } catch (error) {

        console.warn(
          'Toggle active error:',
          error
        );


        alert(
          '상태 변경 중 오류가 발생했습니다.'
        );


        await fetchQuestions();
      }
    };


  /* =========================================================
     Delete
  ========================================================= */

  const handleDelete =
    async (
      id:
        string
    ) => {

      try {

        const response =
          await deleteQuestion(
            id,
            adminPassword
          );


        if (
          response.success
        ) {

          const nextList =
            questions.filter(
              question =>
                question.id !==
                id
            );


          setQuestions(
            nextList
          );


          if (
            selectedQuestionId ===
            id
          ) {

            if (
              nextList.length >
              0
            ) {

              setSelectedQuestionId(
                nextList[0].id
              );


              setIsCreatingNew(
                false
              );

            } else {

              setSelectedQuestionId(
                null
              );


              setIsCreatingNew(
                true
              );
            }
          }

        } else {

          alert(
            response.error ||
            '삭제에 실패했습니다. 관리자 암호를 확인하세요.'
          );
        }

      } catch (error) {

        console.warn(
          'Delete question error:',
          error
        );


        alert(
          '삭제 중 오류가 발생했습니다.'
        );
      }
    };


  /* =========================================================
     Save
  ========================================================= */

  const handleSaveQuestion =
    async (
      payload:
        SaveQuestionPayload
    ):
      Promise<boolean> => {

      try {

        const response =
          await saveQuestion(
            payload,
            adminPassword
          );


        if (
          response.success &&
          response.data?.id
        ) {

          setIsCreatingNew(
            false
          );


          setSelectedQuestionId(
            response.data.id
          );


          await fetchQuestions();


          return true;
        }


        alert(
          response.error ||
          '저장에 실패했습니다. 관리자 암호를 확인해주세요.'
        );


        return false;

      } catch (error) {

        console.warn(
          'Save question error:',
          error
        );


        alert(
          '저장 중 네트워크 오류가 발생했습니다.'
        );


        return false;
      }
    };


  /* =========================================================
     현재 Editor 문제
  ========================================================= */

  const activeQuestion =
    isCreatingNew
      ? null
      : (
          questions.find(
            question =>
              question.id ===
              selectedQuestionId
          ) ||
          questions[0] ||
          null
        );


  /* =========================================================
     세션 검사
  ========================================================= */

  if (
    isCheckingSession
  ) {

    return (

      <div
        className="
          w-full
          min-h-screen
          bg-slate-50
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            text-sm
            text-slate-500
          "
        >

          <div
            className="
              w-5
              h-5
              border-2
              border-slate-300
              border-t-slate-700
              rounded-full
              animate-spin
            "
          />


          <span>
            관리자 인증 확인 중...
          </span>

        </div>

      </div>
    );
  }


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        min-h-screen
        bg-slate-100
        flex
        flex-col
        font-sans
      "
    >

      {/* =====================================================
          로그인
      ===================================================== */}

      {!isAuthenticated ? (

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

          <AdminLogin
            onLogin={
              handleLogin
            }

            error={
              loginError
            }

            isLoading={
              isVerifyingLogin
            }
          />

        </div>

      ) : (

        /* =====================================================
           관리자 Dashboard
        ===================================================== */

        <div
          className="
            w-full
            min-h-screen
            flex
            flex-col
          "
        >

          {/* =================================================
              Header
          ================================================= */}

          <header
            className="
              w-full
              bg-white
              border-b
              border-slate-200
              px-4
              sm:px-6
              py-3
              shrink-0
              flex
              items-center
              justify-between
              z-30
            "
          >

            {/* Game */}

            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                px-3.5
                py-2
                rounded-lg
                text-xs
                sm:text-sm
                font-semibold
                text-slate-700
                hover:text-slate-900
                bg-slate-100
                hover:bg-slate-200
                border
                border-slate-200
                transition-colors
              "
            >

              <ArrowLeft
                className="
                  w-4
                  h-4
                "
              />

              <span>
                게임으로 돌아가기
              </span>

            </Link>


            {/* Title */}

            <div
              className="
                flex
                items-center
                gap-2.5
              "
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-slate-900
                  text-white
                  flex
                  items-center
                  justify-center
                "
              >

                <Shield
                  className="
                    w-4
                    h-4
                  "
                />

              </div>


              <h1
                className="
                  text-base
                  sm:text-lg
                  font-semibold
                  text-slate-900
                  tracking-tight
                  hidden
                  sm:inline
                "
              >
                보안 취약점 게임 관리자
              </h1>

            </div>


            {/* Utility */}

            <div
              className="
                flex
                items-center
                gap-2.5
              "
            >

              <button
                type="button"
                onClick={() =>
                  void fetchQuestions()
                }
                disabled={
                  isLoading
                }
                title="문제 목록 새로고침"
                className="
                  p-2
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-600
                  hover:bg-slate-50
                  transition-colors
                  disabled:opacity-50
                "
              >

                <RefreshCw
                  className={`
                    w-4
                    h-4
                    ${
                      isLoading
                        ? 'animate-spin text-blue-600'
                        : ''
                    }
                  `}
                />

              </button>


              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="
                  px-3.5
                  py-2
                  rounded-lg
                  font-medium
                  text-xs
                  text-slate-600
                  hover:text-red-600
                  hover:bg-red-50
                  border
                  border-slate-200
                  transition-colors
                  flex
                  items-center
                  gap-1.5
                "
              >

                <LogOut
                  className="
                    w-4
                    h-4
                  "
                />

                <span>
                  로그아웃
                </span>

              </button>

            </div>

          </header>


          {/* =================================================
              준비 상태
          ================================================= */}

          <div
            className={`
              px-4
              sm:px-6
              py-2.5
              border-b
              text-xs
              sm:text-sm
              font-semibold
              flex
              items-center
              justify-center
              gap-2
              ${
                isGameReady
                  ? `
                    bg-emerald-50
                    border-emerald-100
                    text-emerald-700
                  `
                  : `
                    bg-amber-50
                    border-amber-100
                    text-amber-800
                  `
              }
            `}
          >

            {
              isGameReady

                ? (
                  <CheckCircle2
                    className="
                      w-4
                      h-4
                    "
                  />
                )

                : (
                  <AlertCircle
                    className="
                      w-4
                      h-4
                    "
                  />
                )
            }


            <span>
              {
                isGameReady
                  ? `활성 문제 ${activeCount}개 · 게임 시작 시 이 중 랜덤 3개가 출제됩니다.`
                  : `현재 활성 문제 ${activeCount}개 · 게임을 진행하려면 최소 3개를 활성화해주세요.`
              }
            </span>

          </div>


          {/* =================================================
              Main Layout
          ================================================= */}

          <div
            className="
              w-full
              flex-1
              grid
              grid-cols-1
              lg:grid-cols-[360px_minmax(0,1fr)]
              overflow-hidden
            "
          >

            {/* =================================================
                Sidebar
            ================================================= */}

            <aside
              className="
                bg-slate-50
                border-r
                border-slate-200
                flex
                flex-col
                h-full
                overflow-y-auto
              "
            >

              {/* Sidebar Header */}

              <div
                className="
                  p-4
                  border-b
                  border-slate-200
                  bg-white
                  sticky
                  top-0
                  z-20
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h2
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    보안 취약점 문제
                  </h2>


                  <p
                    className="
                      text-[11px]
                      text-slate-500
                    "
                  >
                    총 {questions.length}개 · 활성 {activeCount}개
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() => {

                    setIsCreatingNew(
                      true
                    );


                    setSelectedQuestionId(
                      null
                    );
                  }}
                  className={`
                    px-3
                    py-1.5
                    rounded-lg
                    font-semibold
                    text-xs
                    text-white
                    transition-colors
                    flex
                    items-center
                    gap-1
                    ${
                      isCreatingNew
                        ? 'bg-slate-800'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }
                  `}
                >

                  <Plus
                    className="
                      w-3.5
                      h-3.5
                    "
                  />

                  <span>
                    새 문제
                  </span>

                </button>

              </div>


              {/* Error */}

              {error && (

                <div
                  className="
                    p-3
                    m-3
                    rounded-lg
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    text-xs
                    flex
                    items-center
                    gap-2
                  "
                >

                  <AlertCircle
                    className="
                      w-4
                      h-4
                      shrink-0
                    "
                  />

                  <span>
                    {error}
                  </span>

                </div>

              )}


              {/* Question List */}

              <div
                className="
                  p-3
                  space-y-3
                  flex-1
                "
              >

                {isLoading &&
                questions.length ===
                  0 ? (

                  <div
                    className="
                      p-8
                      text-center
                      text-xs
                      text-slate-500
                    "
                  >

                    <div
                      className="
                        w-6
                        h-6
                        mx-auto
                        border-2
                        border-blue-600
                        border-t-transparent
                        rounded-full
                        animate-spin
                        mb-2
                      "
                    />

                    불러오는 중...

                  </div>

                ) : questions.length ===
                  0 ? (

                  <div
                    className="
                      p-8
                      text-center
                      bg-white
                      rounded-xl
                      border
                      border-dashed
                      border-slate-300
                      space-y-2
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-semibold
                        text-slate-600
                      "
                    >
                      등록된 문제가 없습니다.
                    </p>


                    <button
                      type="button"
                      onClick={() => {

                        setIsCreatingNew(
                          true
                        );


                        setSelectedQuestionId(
                          null
                        );
                      }}
                      className="
                        px-3
                        py-1.5
                        bg-blue-600
                        text-white
                        text-xs
                        font-semibold
                        rounded-lg
                      "
                    >
                      + 첫 문제 등록
                    </button>

                  </div>

                ) : (

                  questions.map(
                    question => {

                      const isSelected =
                        !isCreatingNew &&
                        (
                          selectedQuestionId ===
                            question.id ||

                          (
                            !selectedQuestionId &&
                            activeQuestion?.id ===
                              question.id
                          )
                        );


                      const answer =
                        question.answer ||
                        question.answers?.[0];


                      const vulnerabilityLabel =
                        getQuestionVulnerabilityLabel(
                          question
                        );


                      const thumbnailFileId =
                        question.imageId ||
                        question.riskImageId;


                      const thumbnailUrl =
                        question.imageUrl ||
                        question.riskImageUrl;


                      const isAnswerReady =
                        Boolean(
                          answer &&
                          answer.vulnerabilityId
                        );


                      return (

                        <div
                          key={
                            question.id
                          }
                          onClick={() => {

                            setIsCreatingNew(
                              false
                            );


                            setSelectedQuestionId(
                              question.id
                            );
                          }}
                          className={`
                            p-3
                            rounded-2xl
                            border
                            transition-all
                            cursor-pointer
                            relative
                            ${
                              isSelected
                                ? `
                                  bg-blue-50
                                  border-blue-400
                                  shadow-sm
                                `
                                : `
                                  bg-white
                                  border-slate-200
                                  hover:border-blue-200
                                  hover:shadow-sm
                                `
                            }
                          `}
                        >

                          {/* =================================
                              이미지 1장
                          ================================= */}

                          <div
                            className="
                              relative
                              w-full
                              aspect-[16/9]
                              bg-slate-100
                              rounded-xl
                              overflow-hidden
                              mb-3
                            "
                          >

                            <AdminThumbnail
                              fileId={
                                thumbnailFileId
                              }
                              fallbackUrl={
                                thumbnailUrl
                              }
                              alt={
                                question.title
                              }
                            />


                            {/* 활성 상태 */}

                            <div
                              className="
                                absolute
                                top-2
                                left-2
                              "
                            >

                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-1
                                  px-2
                                  py-1
                                  rounded-full
                                  text-[10px]
                                  font-bold
                                  shadow-sm
                                  backdrop-blur
                                  ${
                                    question.active
                                      ? `
                                        bg-emerald-600/90
                                        text-white
                                      `
                                      : `
                                        bg-slate-700/85
                                        text-white
                                      `
                                  }
                                `}
                              >

                                {
                                  question.active
                                    ? (
                                      <CheckCircle2
                                        className="
                                          w-3
                                          h-3
                                        "
                                      />
                                    )
                                    : (
                                      <XCircle
                                        className="
                                          w-3
                                          h-3
                                        "
                                      />
                                    )
                                }

                                {
                                  question.active
                                    ? '출제 중'
                                    : '비활성'
                                }

                              </span>

                            </div>

                          </div>


                          {/* =================================
                              문제명
                          ================================= */}

                          <h3
                            className="
                              font-bold
                              text-xs
                              sm:text-sm
                              text-slate-900
                              truncate
                            "
                            title={
                              question.title
                            }
                          >
                            {question.title}
                          </h3>


                          {/* =================================
                              취약점
                          ================================= */}

                          <div
                            className={`
                              mt-2
                              px-2.5
                              py-2
                              rounded-lg
                              border
                              flex
                              items-center
                              gap-2
                              ${
                                isAnswerReady
                                  ? `
                                    bg-emerald-50
                                    border-emerald-100
                                  `
                                  : `
                                    bg-amber-50
                                    border-amber-200
                                  `
                              }
                            `}
                          >

                            <Target
                              className={`
                                w-3.5
                                h-3.5
                                shrink-0
                                ${
                                  isAnswerReady
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }
                              `}
                            />


                            <span
                              className={`
                                text-[11px]
                                font-semibold
                                truncate
                                ${
                                  isAnswerReady
                                    ? 'text-emerald-800'
                                    : 'text-amber-800'
                                }
                              `}
                            >
                              {vulnerabilityLabel}
                            </span>

                          </div>


                          {/* =================================
                              Actions
                          ================================= */}

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              pt-2.5
                              mt-2.5
                              border-t
                              border-slate-100
                              text-[11px]
                            "
                            onClick={
                              event =>
                                event
                                  .stopPropagation()
                            }
                          >

                            {/* 활성 */}

                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleActive(
                                  question.id,
                                  !question.active
                                )
                              }
                              className={`
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-1
                                rounded-md
                                font-medium
                                text-[10px]
                                transition-colors
                                ${
                                  question.active
                                    ? `
                                      bg-emerald-100
                                      text-emerald-800
                                      hover:bg-emerald-200
                                    `
                                    : `
                                      bg-slate-100
                                      text-slate-500
                                      hover:bg-slate-200
                                    `
                                }
                              `}
                            >

                              {
                                question.active
                                  ? (
                                    <CheckCircle2
                                      className="
                                        w-3
                                        h-3
                                        text-emerald-600
                                      "
                                    />
                                  )
                                  : (
                                    <XCircle
                                      className="
                                        w-3
                                        h-3
                                        text-slate-400
                                      "
                                    />
                                  )
                              }


                              <span>
                                {
                                  question.active
                                    ? '출제 중'
                                    : '비활성'
                                }
                              </span>

                            </button>


                            <div
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >

                              <button
                                type="button"
                                onClick={() => {

                                  setIsCreatingNew(
                                    false
                                  );


                                  setSelectedQuestionId(
                                    question.id
                                  );
                                }}
                                title="문제 수정"
                                className="
                                  p-1.5
                                  text-slate-500
                                  hover:text-blue-600
                                  hover:bg-blue-50
                                  rounded-md
                                "
                              >

                                <Edit3
                                  className="
                                    w-3.5
                                    h-3.5
                                  "
                                />

                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmId(
                                    question.id
                                  )
                                }
                                title="문제 삭제"
                                className="
                                  p-1.5
                                  text-slate-400
                                  hover:text-red-600
                                  hover:bg-red-50
                                  rounded-md
                                "
                              >

                                <Trash2
                                  className="
                                    w-3.5
                                    h-3.5
                                  "
                                />

                              </button>

                            </div>

                          </div>

                        </div>

                      );
                    }
                  )
                )}

              </div>

            </aside>


            {/* =================================================
                Editor
            ================================================= */}

            <main
              className="
                bg-slate-100
                overflow-y-auto
                flex-1
              "
            >

              <QuestionEditor
                key={
                  isCreatingNew
                    ? 'new-question'
                    : activeQuestion?.id ||
                      'empty'
                }

                initialData={
                  activeQuestion
                }

                adminPassword={
                  adminPassword
                }

                onSave={
                  handleSaveQuestion
                }

                onCancel={() => {

                  if (
                    questions.length >
                    0
                  ) {

                    setIsCreatingNew(
                      false
                    );


                    setSelectedQuestionId(
                      questions[0].id
                    );
                  }
                }}
              />

            </main>

          </div>


          {/* =================================================
              삭제 확인
          ================================================= */}

          {deleteConfirmId && (

            <div
              className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                p-4
                bg-slate-950/50
              "
            >

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-xl
                  max-w-sm
                  w-full
                  p-6
                  space-y-4
                "
              >

                <h3
                  className="
                    text-base
                    font-semibold
                    text-slate-900
                  "
                >
                  문제 삭제 확인
                </h3>


                <p
                  className="
                    text-xs
                    text-slate-600
                    leading-relaxed
                  "
                >
                  정말 이 보안 취약점 문제를 삭제하시겠습니까?
                  <br />
                  삭제된 문제는 복구할 수 없습니다.
                </p>


                <div
                  className="
                    flex
                    items-center
                    justify-end
                    gap-2
                    pt-2
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirmId(
                        null
                      )
                    }
                    className="
                      px-4
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      text-slate-600
                      hover:bg-slate-100
                    "
                  >
                    취소
                  </button>


                  <button
                    type="button"
                    onClick={() => {

                      const id =
                        deleteConfirmId;


                      setDeleteConfirmId(
                        null
                      );


                      void handleDelete(
                        id
                      );
                    }}
                    className="
                      px-4
                      py-2
                      rounded-lg
                      text-xs
                      font-semibold
                      text-white
                      bg-red-600
                      hover:bg-red-700
                    "
                  >
                    삭제하기
                  </button>

                </div>

              </div>

            </div>

          )}

        </div>
      )}

    </div>
  );
};