import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { Link } from 'react-router-dom';

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

import { AdminLogin } from '../components/AdminLogin';
import { QuestionEditor } from '../components/QuestionEditor';

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
} from 'lucide-react';


/* =========================================================
   관리자 문제 목록 썸네일

   Drive fileId
        ↓
   Apps Script
        ↓
   Base64 Data URL
        ↓
   img src
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

  const [src, setSrc] =
    useState<string>('');

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [hasError, setHasError] =
    useState<boolean>(false);


  useEffect(() => {

    let cancelled = false;


    const loadImage = async () => {

      setSrc('');
      setIsLoading(true);
      setHasError(false);


      /*
       * 신규 구조
       * Drive fileId 우선 사용
       */
      if (fileId) {

        try {

          const result =
            await getDriveImageDataUrl(
              fileId
            );


          if (cancelled) {
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


      /*
       * 과거 URL 저장 데이터 호환
       */
      if (fallbackUrl) {

        if (!cancelled) {

          setSrc(
            fallbackUrl
          );

          setIsLoading(
            false
          );
        }

        return;
      }


      if (!cancelled) {

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

      cancelled = true;
    };

  }, [
    fileId,
    fallbackUrl,
  ]);


  if (isLoading) {

    return (
      <div
        className="
          w-full
          h-full
          flex
          items-center
          justify-center
          bg-slate-900
        "
      >
        <div
          className="
            w-4
            h-4
            border-2
            border-slate-500
            border-t-white
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
          items-center
          justify-center
          bg-slate-800
          text-slate-500
        "
      >
        <AlertCircle
          className="
            w-4
            h-4
          "
        />
      </div>
    );
  }


  return (
    <img
      src={src}
      alt={alt}
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
   Admin Page
========================================================= */

export const AdminPage:
React.FC = () => {

  /* =========================================================
     관리자 인증 상태
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
     문제 목록 상태
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
     현재 선택 문제
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
     기존 브라우저 세션 비밀번호 재검증
  ========================================================= */

  useEffect(() => {

    const verifyExistingSession =
      async () => {

        const savedPassword =
          sessionStorage.getItem(
            'hospital_admin_pw'
          );


        if (!savedPassword) {

          setIsCheckingSession(
            false
          );

          return;
        }


        try {

          const res =
            await verifyAdminPassword(
              savedPassword
            );


          if (
            res.success === true &&
            res.authenticated === true
          ) {

            setAdminPassword(
              savedPassword
            );

            setIsAuthenticated(
              true
            );

          } else {

            sessionStorage.removeItem(
              'hospital_admin_pw'
            );

            setAdminPassword(
              ''
            );

            setIsAuthenticated(
              false
            );
          }

        } catch (err) {

          console.error(
            '기존 관리자 세션 검증 오류:',
            err
          );


          sessionStorage.removeItem(
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

  }, []);


  /* =========================================================
     문제 목록 불러오기
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

          const res =
            await getQuestions();


          if (
            res.success &&
            res.data
          ) {

            setQuestions(
              res.data
            );


            if (
              res.data.length > 0 &&
              !selectedQuestionId &&
              !isCreatingNew
            ) {

              setSelectedQuestionId(
                res.data[0].id
              );
            }

          } else {

            setError(
              res.error ||
              '문제 목록을 불러오지 못했습니다.'
            );
          }

        } catch (err) {

          console.warn(
            'Failed to fetch questions:',
            err
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
     인증 완료 후 문제 목록 로딩
  ========================================================= */

  useEffect(() => {

    if (
      isAuthenticated
    ) {

      void fetchQuestions();
    }

  }, [
    isAuthenticated,
    fetchQuestions,
  ]);


  /* =========================================================
     관리자 로그인
  ========================================================= */

  const handleLogin =
    async (
      pw: string
    ) => {

      const password =
        pw.trim();


      if (!password) {

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

        const res =
          await verifyAdminPassword(
            password
          );


        if (
          !res.success ||
          res.authenticated !== true
        ) {

          setLoginError(
            res.error ||
            '관리자 비밀번호가 올바르지 않습니다.'
          );


          setAdminPassword(
            ''
          );

          setIsAuthenticated(
            false
          );


          sessionStorage.removeItem(
            'hospital_admin_pw'
          );


          return;
        }


        sessionStorage.setItem(
          'hospital_admin_pw',
          password
        );


        setAdminPassword(
          password
        );


        setIsAuthenticated(
          true
        );

      } catch (err) {

        console.error(
          '관리자 로그인 오류:',
          err
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


        sessionStorage.removeItem(
          'hospital_admin_pw'
        );

      } finally {

        setIsVerifyingLogin(
          false
        );
      }
    };


  /* =========================================================
     로그아웃
  ========================================================= */

  const handleLogout =
    () => {

      sessionStorage.removeItem(
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
     문제 활성 / 비활성
  ========================================================= */

  const handleToggleActive =
    async (
      id: string,
      nextActive: boolean
    ) => {

      try {

        /*
         * UI 먼저 반영
         */
        setQuestions(
          prev =>
            prev.map(
              q =>
                q.id === id
                  ? {
                      ...q,
                      active:
                        nextActive,
                    }
                  : q
            )
        );


        const res =
          await toggleQuestion(
            id,
            nextActive,
            adminPassword
          );


        if (
          !res.success
        ) {

          alert(
            res.error ||
            '상태 변경에 실패했습니다. 관리자 암호를 확인하세요.'
          );


          await fetchQuestions();
        }

      } catch (err) {

        console.warn(
          'Toggle active error:',
          err
        );


        alert(
          '상태 변경 중 오류가 발생했습니다.'
        );


        await fetchQuestions();
      }
    };


  /* =========================================================
     문제 삭제
  ========================================================= */

  const handleDelete =
    async (
      id: string
    ) => {

      try {

        const res =
          await deleteQuestion(
            id,
            adminPassword
          );


        if (
          res.success
        ) {

          const nextList =
            questions.filter(
              q =>
                q.id !== id
            );


          setQuestions(
            nextList
          );


          if (
            selectedQuestionId ===
            id
          ) {

            if (
              nextList.length > 0
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
            res.error ||
            '삭제에 실패했습니다. 관리자 암호를 확인하세요.'
          );
        }

      } catch (err) {

        console.warn(
          'Delete question error:',
          err
        );


        alert(
          '삭제 중 오류가 발생했습니다.'
        );
      }
    };


  /* =========================================================
     문제 저장
  ========================================================= */

  const handleSaveQuestion =
    async (
      payload:
        SaveQuestionPayload
    ): Promise<boolean> => {

      try {

        const res =
          await saveQuestion(
            payload,
            adminPassword
          );


        if (
          res.success &&
          res.data?.id
        ) {

          setIsCreatingNew(
            false
          );


          setSelectedQuestionId(
            res.data.id
          );


          await fetchQuestions();


          return true;

        } else {

          alert(
            res.error ||
            '저장에 실패했습니다. 관리자 암호를 확인해주세요.'
          );


          return false;
        }

      } catch (err) {

        console.warn(
          'Save question error:',
          err
        );


        alert(
          '저장 중 네트워크 오류가 발생했습니다.'
        );


        return false;
      }
    };


  /* =========================================================
     현재 Editor에 표시할 문제
  ========================================================= */

  const activeQuestion =
    isCreatingNew
      ? null
      : (
          questions.find(
            q =>
              q.id ===
              selectedQuestionId
          ) ||
          questions[0] ||
          null
        );


  /* =========================================================
     기존 세션 검사 중
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
          로그인 화면
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
              상단 Navigation
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

            {/* 게임으로 돌아가기 */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

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

            </div>


            {/* 중앙 타이틀 */}

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
                보안 위험 찾기 관리자
              </h1>

            </div>


            {/* 우측 버튼 */}

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
              Main Layout
          ================================================= */}

          <div
            className="
              w-full
              flex-1
              grid
              grid-cols-1
              lg:grid-cols-[340px_minmax(0,1fr)]
              overflow-hidden
            "
          >

            {/* =================================================
                왼쪽 문제 목록
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
                    문제 목록
                  </h2>

                  <p
                    className="
                      text-[11px]
                      text-slate-500
                    "
                  >
                    총 {questions.length}개 등록됨
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


              {/* API Error */}

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


              {/* 문제 리스트 */}

              <div
                className="
                  p-3
                  space-y-2.5
                  flex-1
                "
              >

                {isLoading &&
                questions.length === 0 ? (

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

                ) : questions.length === 0 ? (

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
                      + 새 문제 등록
                    </button>

                  </div>

                ) : (

                  questions.map(
                    q => {

                      const isSelected =
                        !isCreatingNew &&
                        (
                          selectedQuestionId ===
                            q.id ||
                          (
                            !selectedQuestionId &&
                            activeQuestion?.id ===
                              q.id
                          )
                        );


                      return (

                        <div
                          key={
                            q.id
                          }
                          onClick={() => {

                            setIsCreatingNew(
                              false
                            );

                            setSelectedQuestionId(
                              q.id
                            );
                          }}
                          className={`
                            p-3
                            rounded-xl
                            border
                            transition-colors
                            cursor-pointer
                            relative
                            ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }
                          `}
                        >

                          {/* =================================
                              썸네일

                              기존:
                              q.normalImageUrl
                              q.riskImageUrl

                              변경:
                              Drive fileId → Base64
                          ================================= */}

                          <div
                            className="
                              grid
                              grid-cols-2
                              gap-1
                              mb-2
                            "
                          >

                            <div
                              className="
                                relative
                                aspect-[3/2]
                                bg-slate-900
                                rounded-md
                                overflow-hidden
                              "
                            >

                              <AdminThumbnail
                                fileId={
                                  q.normalImageId
                                }
                                fallbackUrl={
                                  q.normalImageUrl
                                }
                                alt="정상 이미지"
                              />

                            </div>


                            <div
                              className="
                                relative
                                aspect-[3/2]
                                bg-slate-900
                                rounded-md
                                overflow-hidden
                              "
                            >

                              <AdminThumbnail
                                fileId={
                                  q.riskImageId
                                }
                                fallbackUrl={
                                  q.riskImageUrl
                                }
                                alt="위험 이미지"
                              />

                            </div>

                          </div>


                          {/* 제목 */}

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-1
                              mb-1
                            "
                          >

                            <h3
                              className="
                                font-semibold
                                text-xs
                                text-slate-900
                                truncate
                              "
                            >
                              {q.title}
                            </h3>


                            <span
                              className="
                                text-[10px]
                                font-semibold
                                text-blue-700
                                bg-blue-100
                                px-1.5
                                py-0.5
                                rounded
                                shrink-0
                              "
                            >
                              {q.answers?.length || 0}개
                            </span>

                          </div>


                          {/* 하단 Action */}

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              pt-1.5
                              border-t
                              border-slate-100
                              text-[11px]
                            "
                            onClick={e =>
                              e.stopPropagation()
                            }
                          >

                            {/* 활성/비활성 */}

                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleActive(
                                  q.id,
                                  !q.active
                                )
                              }
                              className={`
                                inline-flex
                                items-center
                                gap-1
                                px-1.5
                                py-0.5
                                rounded-md
                                font-medium
                                text-[10px]
                                ${
                                  q.active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }
                              `}
                            >

                              {q.active ? (

                                <CheckCircle2
                                  className="
                                    w-3
                                    h-3
                                    text-emerald-600
                                  "
                                />

                              ) : (

                                <XCircle
                                  className="
                                    w-3
                                    h-3
                                    text-slate-400
                                  "
                                />
                              )}


                              <span>
                                {
                                  q.active
                                    ? '출제 중'
                                    : '비활성'
                                }
                              </span>

                            </button>


                            {/* 수정 / 삭제 */}

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
                                    q.id
                                  );
                                }}
                                title="문제 수정"
                                className="
                                  p-1
                                  text-slate-500
                                  hover:text-blue-600
                                  hover:bg-blue-50
                                  rounded
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
                                    q.id
                                  )
                                }
                                title="문제 삭제"
                                className="
                                  p-1
                                  text-slate-400
                                  hover:text-red-600
                                  hover:bg-red-50
                                  rounded
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
                오른쪽 편집 영역
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
                    questions.length > 0
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
              삭제 확인 Modal
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
                  rounded-xl
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
                  정말 삭제하시겠습니까?
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