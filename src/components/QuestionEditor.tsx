import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Save,
  Upload,
  AlertCircle,
  ShieldAlert,
  MousePointer2,
  CheckCircle2,
} from 'lucide-react';

import {
  resolveQuestionImage,
  type Question,
  type SecurityAnswer,
  type SaveQuestionPayload,
} from '../services/apiService';

import {
  SECURITY_VULNERABILITIES,
  getSecurityVulnerabilityById,
  type SecurityVulnerabilityId,
} from '../constants/securityVulnerabilities';

import {
  compressAndConvertToBase64,
} from '../utils/imageCompression';

import {
  ImageAnswerEditor,
} from './ImageAnswerEditor';


interface QuestionEditorProps {

  initialData?:
    Question |
    null;

  /*
   * AdminPage 기존 호출 구조와의 호환용
   */
  adminPassword:
    string;

  onSave: (
    payload:
      SaveQuestionPayload
  ) => Promise<boolean>;

  onCancel:
    () => void;
}


/* =========================================================
   QuestionEditor
========================================================= */

export const QuestionEditor:
React.FC<QuestionEditorProps> = ({

  initialData,

  onSave,

  onCancel,

}) => {

  const isEditing =
    Boolean(
      initialData?.id
    );


  /* =========================================================
     기본 정보
  ========================================================= */

  const [
    title,
    setTitle,
  ] =
    useState<string>(
      initialData?.title ||
      ''
    );


  const [
    active,
    setActive,
  ] =
    useState<boolean>(
      initialData?.active ??
      true
    );


  /* =========================================================
     이미지
  ========================================================= */

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState<string>(
      ''
    );


  const [
    newImageFile,
    setNewImageFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    isLoadingExistingImage,
    setIsLoadingExistingImage,
  ] =
    useState<boolean>(
      false
    );


  const [
    imageLoadError,
    setImageLoadError,
  ] =
    useState<string | null>(
      null
    );


  const imageObjectUrlRef =
    useRef<string | null>(
      null
    );


  /* =========================================================
     정답 인정 위치

     중요:
     이제 문제 하나에 여러 위치 등록 가능

     ex)
     answers[0] = 왼쪽 EMR
     answers[1] = 오른쪽 EMR
  ========================================================= */

  const [
    answers,
    setAnswers,
  ] =
    useState<SecurityAnswer[]>(
      []
    );


  /* =========================================================
     취약점 종류
  ========================================================= */

  const [
    selectedVulnerabilityId,
    setSelectedVulnerabilityId,
  ] =
    useState<
      SecurityVulnerabilityId |
      ''
    >(
      ''
    );


  /* =========================================================
     4지선다 제외 항목
  ========================================================= */

  const [
    excludedChoiceIds,
    setExcludedChoiceIds,
  ] =
    useState<
      SecurityVulnerabilityId[]
    >(
      initialData
        ?.excludedChoiceIds ||
      []
    );


  /* =========================================================
     저장 상태
  ========================================================= */

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState<boolean>(
      false
    );


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );


  /* =========================================================
     기존 데이터 로딩
  ========================================================= */

  useEffect(
    () => {

      let cancelled =
        false;


      const loadInitialData =
        async () => {

          /* -----------------------------------------------
             기존 Object URL 정리
          ----------------------------------------------- */

          if (
            imageObjectUrlRef.current
          ) {

            URL.revokeObjectURL(
              imageObjectUrlRef.current
            );


            imageObjectUrlRef.current =
              null;
          }


          /* -----------------------------------------------
             기본 값
          ----------------------------------------------- */

          setTitle(
            initialData?.title ||
            ''
          );


          setActive(
            initialData?.active ??
            true
          );


          setNewImageFile(
            null
          );


          setImagePreview(
            ''
          );


          setImageLoadError(
            null
          );


          /* -----------------------------------------------
             기존 정답 위치 가져오기

             우선순위:

             1. answers[] 여러 위치
             2. answer 단일 위치
          ----------------------------------------------- */

          let existingAnswers:
            SecurityAnswer[] = [];


          if (
            Array.isArray(
              initialData?.answers
            ) &&
            (
              initialData
                ?.answers
                ?.length ||
              0
            ) >
              0
          ) {

            existingAnswers =
              initialData
                ?.answers
                ?.map(
                  (
                    answer,
                    index
                  ) => ({

                    ...answer,

                    id:
                      index +
                      1,
                  })
                ) ||
              [];

          } else if (
            initialData?.answer
          ) {

            existingAnswers = [
              {
                ...initialData.answer,

                id:
                  1,
              },
            ];
          }


          setAnswers(
            existingAnswers
          );


          /* -----------------------------------------------
             vulnerabilityId 결정

             대표 정답은 첫 번째 위치
          ----------------------------------------------- */

          const representativeAnswer =
            existingAnswers[0] ||
            initialData?.answer ||
            null;


          let initialVulnerabilityId:
            SecurityVulnerabilityId |
            '' =
              '';


          if (
            representativeAnswer
              ?.vulnerabilityId
          ) {

            initialVulnerabilityId =
              representativeAnswer
                .vulnerabilityId;

          } else if (
            representativeAnswer
              ?.title
          ) {

            const matched =
              SECURITY_VULNERABILITIES
                .find(
                  item =>
                    item.label ===
                    representativeAnswer.title
                );


            if (
              matched
            ) {

              initialVulnerabilityId =
                matched.id;
            }
          }


          setSelectedVulnerabilityId(
            initialVulnerabilityId
          );


          /*
           * 정답 취약점과
           * 기존 위치들의 메타데이터 동기화
           */
          if (
            initialVulnerabilityId
          ) {

            const vulnerability =
              getSecurityVulnerabilityById(
                initialVulnerabilityId
              );


            if (
              vulnerability
            ) {

              existingAnswers =
                existingAnswers.map(
                  (
                    answer,
                    index
                  ) => ({

                    ...answer,

                    id:
                      index +
                      1,

                    vulnerabilityId:
                      vulnerability.id,

                    title:
                      vulnerability.label,

                    explanation:
                      answer.explanation ||
                      vulnerability.description,
                  })
                );


              setAnswers(
                existingAnswers
              );
            }
          }


          /* -----------------------------------------------
             기존 4지선다 제외 목록
          ----------------------------------------------- */

          const initialExcludedChoiceIds =
            Array.isArray(
              initialData
                ?.excludedChoiceIds
            )
              ? initialData
                  .excludedChoiceIds
                  .filter(
                    id =>
                      id !==
                      initialVulnerabilityId
                  )
              : [];


          setExcludedChoiceIds(
            initialExcludedChoiceIds
          );


          /* -----------------------------------------------
             신규 문제
          ----------------------------------------------- */

          if (
            !initialData
          ) {

            setIsLoadingExistingImage(
              false
            );


            return;
          }


          /* -----------------------------------------------
             기존 이미지 조회
          ----------------------------------------------- */

          setIsLoadingExistingImage(
            true
          );


          try {

            const result =
              await resolveQuestionImage(
                initialData
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

              setImagePreview(
                result.data
                  .imageSrc
              );

            } else {

              setImageLoadError(
                result.error ||
                '기존 이미지를 불러오지 못했습니다.'
              );
            }

          } catch (error) {

            console.error(
              '기존 이미지 조회 오류:',
              error
            );


            if (
              !cancelled
            ) {

              setImageLoadError(
                '기존 이미지를 불러오는 중 오류가 발생했습니다.'
              );
            }

          } finally {

            if (
              !cancelled
            ) {

              setIsLoadingExistingImage(
                false
              );
            }
          }
        };


      void loadInitialData();


      return () => {

        cancelled =
          true;
      };

    },
    [
      initialData,
    ]
  );


  /* =========================================================
     Unmount Cleanup
  ========================================================= */

  useEffect(
    () => {

      return () => {

        if (
          imageObjectUrlRef.current
        ) {

          URL.revokeObjectURL(
            imageObjectUrlRef.current
          );
        }
      };

    },
    []
  );


  /* =========================================================
     이미지 변경
  ========================================================= */

  const handleImageFileChange =
    (
      e:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        e.target.files?.[0];


      if (
        !file
      ) {

        return;
      }


      if (
        imageObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          imageObjectUrlRef.current
        );
      }


      const objectUrl =
        URL.createObjectURL(
          file
        );


      imageObjectUrlRef.current =
        objectUrl;


      setNewImageFile(
        file
      );


      setImagePreview(
        objectUrl
      );


      setImageLoadError(
        null
      );


      /*
       * 사진이 바뀌면
       * 기존 위치 좌표는 의미가 없으므로 전부 초기화
       */
      setAnswers(
        []
      );


      e.target.value =
        '';
    };


  /* =========================================================
     취약점 선택
  ========================================================= */

  const handleVulnerabilityChange =
    (
      value:
        string
    ) => {

      const vulnerabilityId =
        value as
          SecurityVulnerabilityId;


      setSelectedVulnerabilityId(
        vulnerabilityId
      );


      /*
       * 정답으로 선택한 항목은
       * 4지선다 제외 목록에서 자동 제거
       */
      setExcludedChoiceIds(
        previous =>
          previous.filter(
            id =>
              id !==
              vulnerabilityId
          )
      );


      const vulnerability =
        getSecurityVulnerabilityById(
          vulnerabilityId
        );


      /*
       * 등록된 모든 정답 인정 위치에
       * 동일한 취약점 메타데이터 적용
       */
      if (
        vulnerability
      ) {

        setAnswers(
          previous =>
            previous.map(
              (
                answer,
                index
              ) => ({

                ...answer,

                id:
                  index +
                  1,

                vulnerabilityId:
                  vulnerability.id,

                title:
                  vulnerability.label,

                hint:
                  answer.hint ||
                  '',

                explanation:
                  vulnerability.description,
              })
            )
        );
      }
    };


  /* =========================================================
     4지선다 제외 항목
  ========================================================= */

  const handleExcludedChoiceToggle =
    (
      vulnerabilityId:
        SecurityVulnerabilityId
    ) => {

      /*
       * 정답은 제외 목록에 넣을 필요 없음
       */
      if (
        vulnerabilityId ===
        selectedVulnerabilityId
      ) {

        return;
      }


      setExcludedChoiceIds(
        previous => {

          if (
            previous.includes(
              vulnerabilityId
            )
          ) {

            return previous.filter(
              id =>
                id !==
                vulnerabilityId
            );
          }


          return [
            ...previous,
            vulnerabilityId,
          ];
        }
      );
    };


  /* =========================================================
     ImageAnswerEditor → 여러 정답 위치 처리
  ========================================================= */

  const handleAnswerChange =
    (
      nextAnswers:
        SecurityAnswer[]
    ) => {

      if (
        nextAnswers.length ===
        0
      ) {

        setAnswers(
          []
        );


        return;
      }


      const vulnerability =
        selectedVulnerabilityId
          ? getSecurityVulnerabilityById(
              selectedVulnerabilityId
            )
          : undefined;


      /*
       * 위치는 여러 개
       * 취약점 유형은 모두 동일
       */
      const normalizedAnswers:
        SecurityAnswer[] =
          nextAnswers.map(
            (
              answer,
              index
            ) => ({

              ...answer,


              /*
               * 위치별 고유 ID
               */
              id:
                index +
                1,


              vulnerabilityId:
                selectedVulnerabilityId ||
                answer.vulnerabilityId,


              title:
                vulnerability
                  ?.label ||
                answer.title ||
                '보안 취약점',


              hint:
                answer.hint ||
                '',


              explanation:
                vulnerability
                  ?.description ||
                answer.explanation ||
                '',
            })
          );


      setAnswers(
        normalizedAnswers
      );
    };


  /* =========================================================
     저장
  ========================================================= */

  const handleSubmit =
    async (
      e:
        React.FormEvent
    ) => {

      e.preventDefault();


      setErrorMessage(
        null
      );


      /* -------------------------------------------------------
         Validation
      ------------------------------------------------------- */

      if (
        !title.trim()
      ) {

        setErrorMessage(
          '문제명을 입력해주세요.'
        );


        return;
      }


      if (
        !imagePreview
      ) {

        setErrorMessage(
          '보안 취약점 이미지를 등록해주세요.'
        );


        return;
      }


      if (
        !selectedVulnerabilityId
      ) {

        setErrorMessage(
          '이 이미지에 해당하는 보안 취약점 유형을 선택해주세요.'
        );


        return;
      }


      if (
        answers.length ===
        0
      ) {

        setErrorMessage(
          '이미지에서 정답으로 인정할 보안 취약점 위치를 한 곳 이상 지정해주세요.'
        );


        return;
      }


      const vulnerability =
        getSecurityVulnerabilityById(
          selectedVulnerabilityId
        );


      if (
        !vulnerability
      ) {

        setErrorMessage(
          '선택한 보안 취약점 정보가 올바르지 않습니다.'
        );


        return;
      }


      /*
       * 오답 후보 3개 확보 검증
       */
      const availableDistractorCount =
        SECURITY_VULNERABILITIES
          .filter(
            item =>
              item.id !==
                selectedVulnerabilityId &&

              !excludedChoiceIds
                .includes(
                  item.id
                )
          )
          .length;


      if (
        availableDistractorCount <
        3
      ) {

        setErrorMessage(
          '4지선다 오답 후보가 최소 3개 이상 남아 있어야 합니다. 제외 항목을 줄여주세요.'
        );


        return;
      }


      setIsSubmitting(
        true
      );


      try {

        let imageBase64:
          string |
          undefined;


        /*
         * 신규 이미지일 때만 압축
         */
        if (
          newImageFile
        ) {

          imageBase64 =
            await compressAndConvertToBase64(
              newImageFile
            );
        }


        /* -----------------------------------------------------
           최종 정답 인정 위치

           위치는 여러 개이지만
           모두 같은 취약점으로 통일
        ----------------------------------------------------- */

        const finalAnswers:
          SecurityAnswer[] =
            answers.map(
              (
                answer,
                index
              ) => ({

                ...answer,


                id:
                  index +
                  1,


                vulnerabilityId:
                  vulnerability.id,


                title:
                  vulnerability.label,


                hint:
                  answer.hint ||
                  '',


                explanation:
                  vulnerability.description,
              })
            );


        /*
         * 신규 answer 필드는
         * 대표값으로 첫 번째 위치 사용
         *
         * 기존 API / 관리자 목록 호환용
         */
        const representativeAnswer =
          finalAnswers[0];


        /* -----------------------------------------------------
           Payload
        ----------------------------------------------------- */

        const payload:
          SaveQuestionPayload = {

          id:
            initialData?.id,


          title:
            title.trim(),


          /* ===============================================
             신규 이미지
          =============================================== */

          imageBase64:
            imageBase64,


          imageUrl:
            !imageBase64
              ? initialData
                  ?.imageUrl
              : undefined,


          imageId:
            !imageBase64
              ? (
                  initialData
                    ?.imageId ||

                  initialData
                    ?.riskImageId
                )
              : undefined,


          /* ===============================================
             대표 정답
          =============================================== */

          answer:
            representativeAnswer,


          /* ===============================================
             4지선다 제외 목록
          =============================================== */

          excludedChoiceIds:
            excludedChoiceIds
              .filter(
                id =>
                  id !==
                  vulnerability.id
              ),


          /* ===============================================
             여러 정답 인정 위치
          =============================================== */

          answers:
            finalAnswers,


          /*
           * 게임 전체 60초이므로
           * 개별 문제값은 호환 목적으로 유지
           */
          timeLimit:
            60,


          lives:
            3,


          hintCount:
            1,


          active,
        };


        const success =
          await onSave(
            payload
          );


        if (
          !success
        ) {

          setErrorMessage(
            '문제 저장에 실패했습니다. 관리자 인증 정보와 네트워크 연결을 확인해주세요.'
          );
        }

      } catch (error) {

        console.error(
          '문제 저장 오류:',
          error
        );


        setErrorMessage(
          '이미지 압축 또는 전송 중 오류가 발생했습니다.'
        );

      } finally {

        setIsSubmitting(
          false
        );
      }
    };


  /* =========================================================
     현재 선택된 취약점
  ========================================================= */

  const selectedVulnerability =
    selectedVulnerabilityId
      ? getSecurityVulnerabilityById(
          selectedVulnerabilityId
        )
      : undefined;


  const availableDistractorCount =
    selectedVulnerabilityId
      ? SECURITY_VULNERABILITIES
          .filter(
            item =>
              item.id !==
                selectedVulnerabilityId &&

              !excludedChoiceIds
                .includes(
                  item.id
                )
          )
          .length
      : 0;


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        max-w-none
        p-3
        sm:p-5
        lg:p-6
        animate-fade-in
        text-slate-900
      "
    >

      <form
        onSubmit={
          handleSubmit
        }
        className="
          space-y-6
        "
      >

        {/* ===================================================
            Header
        =================================================== */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-4
            bg-white
            p-4
            sm:p-6
            rounded-2xl
            border
            border-sky-100
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <button
              type="button"
              onClick={
                onCancel
              }
              className="
                p-2
                rounded-xl
                text-slate-500
                hover:text-blue-700
                hover:bg-blue-50
                transition-colors
              "
              aria-label="뒤로가기"
            >

              <ArrowLeft
                className="
                  w-5
                  h-5
                "
              />

            </button>


            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-slate-900
                "
              >
                {
                  isEditing
                    ? '보안 취약점 문제 수정'
                    : '보안 취약점 문제 등록'
                }
              </h2>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                취약점 사진 한 장과 정답 인정 위치, 취약점 유형,
                4지선다 제외 항목을 등록합니다.
              </p>

            </div>

          </div>


          <div
            className="
              flex
              items-center
              justify-end
              gap-2
            "
          >

            <button
              type="button"
              onClick={
                onCancel
              }
              disabled={
                isSubmitting
              }
              className="
                px-4
                py-2.5
                rounded-xl
                text-sm
                font-semibold
                text-slate-600
                hover:bg-slate-100
                transition-colors
                disabled:opacity-50
              "
            >
              취소
            </button>


            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingExistingImage
              }
              className="
                px-5
                py-2.5
                rounded-xl
                text-sm
                font-bold
                text-white
                bg-blue-600
                hover:bg-blue-700
                active:bg-blue-800
                disabled:bg-slate-400
                transition-all
                flex
                items-center
                gap-2
                shadow-sm
                shadow-blue-100
                cursor-pointer
                disabled:cursor-not-allowed
              "
            >

              {
                isSubmitting
                  ? (
                    <>
                      <div
                        className="
                          w-4
                          h-4
                          border-2
                          border-white/40
                          border-t-white
                          rounded-full
                          animate-spin
                        "
                      />

                      <span>
                        저장 중...
                      </span>
                    </>
                  )
                  : (
                    <>
                      <Save
                        className="
                          w-4
                          h-4
                        "
                      />

                      <span>
                        저장하기
                      </span>
                    </>
                  )
              }

            </button>

          </div>

        </div>


        {/* ===================================================
            Error
        =================================================== */}

        {errorMessage && (

          <div
            className="
              p-4
              rounded-xl
              bg-rose-50
              border
              border-rose-200
              text-rose-700
              text-sm
              flex
              items-center
              gap-2.5
            "
          >

            <AlertCircle
              className="
                w-5
                h-5
                shrink-0
              "
            />

            <span>
              {errorMessage}
            </span>

          </div>
        )}


        {imageLoadError && (

          <div
            className="
              p-4
              rounded-xl
              bg-amber-50
              border
              border-amber-200
              text-amber-800
              text-sm
              flex
              items-center
              gap-2.5
            "
          >

            <AlertCircle
              className="
                w-5
                h-5
                shrink-0
              "
            />

            <span>
              {imageLoadError}
            </span>

          </div>
        )}


        {/* ===================================================
            안내
        =================================================== */}

        <div
          className="
            bg-blue-50
            border
            border-blue-100
            rounded-2xl
            p-4
            sm:p-5
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <ShieldAlert
              className="
                w-5
                h-5
                text-blue-600
                shrink-0
                mt-0.5
              "
            />


            <div>

              <div
                className="
                  text-sm
                  font-bold
                  text-blue-900
                "
              >
                문제 등록 방식
              </div>


              <p
                className="
                  text-xs
                  sm:text-sm
                  text-blue-700
                  leading-relaxed
                  mt-1
                "
              >
                한 문제에는 보안 취약점 사진 1장을 등록합니다.
                같은 취약점이 사진 안에 여러 곳 존재한다면 정답 인정 위치를 여러 곳 등록할 수 있습니다.
                참가자는 등록한 위치 중 어느 한 곳을 클릭해도 위치 정답으로 인정됩니다.
              </p>

            </div>

          </div>

        </div>


        {/* ===================================================
            기본 정보
        =================================================== */}

        <div
          className="
            bg-white
            p-6
            rounded-2xl
            border
            border-sky-100
            shadow-sm
            space-y-5
          "
        >

          <div
            className="
              border-b
              border-slate-100
              pb-3
            "
          >

            <h3
              className="
                text-sm
                font-bold
                text-slate-900
              "
            >
              1. 기본 정보
            </h3>

          </div>


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[minmax(0,1fr)_auto]
              gap-4
            "
          >

            <div>

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                관리자용 문제명
              </label>


              <input
                type="text"
                value={
                  title
                }
                onChange={
                  e =>
                    setTitle(
                      e.target.value
                    )
                }
                placeholder="예: 간호사 스테이션 - EMR 화면 노출"
                required
                className="
                  w-full
                  mt-1.5
                  px-3.5
                  py-2.5
                  text-sm
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-400
                "
              />

            </div>


            <div
              className="
                flex
                items-end
                pb-2
              "
            >

              <label
                className="
                  flex
                  items-center
                  gap-2
                  cursor-pointer
                  select-none
                "
              >

                <input
                  type="checkbox"
                  checked={
                    active
                  }
                  onChange={
                    e =>
                      setActive(
                        e.target.checked
                      )
                  }
                  className="
                    w-4
                    h-4
                    text-blue-600
                    rounded
                    focus:ring-blue-500
                  "
                />


                <span
                  className="
                    text-sm
                    font-bold
                    text-slate-700
                    whitespace-nowrap
                  "
                >
                  게임 출제 활성화
                </span>

              </label>

            </div>

          </div>

        </div>


        {/* ===================================================
            정답 취약점 / 4지선다 제외
        =================================================== */}

        <div
          className="
            bg-white
            p-6
            rounded-2xl
            border
            border-sky-100
            shadow-sm
            space-y-4
          "
        >

          <div
            className="
              border-b
              border-slate-100
              pb-3
            "
          >

            <h3
              className="
                text-sm
                font-bold
                text-slate-900
              "
            >
              2. 정답 취약점 선택
            </h3>


            <p
              className="
                text-xs
                text-slate-500
                mt-1
              "
            >
              참가자가 위치를 찾은 후 맞혀야 할 실제 취약점 유형입니다.
              오답 3개는 제외 설정을 반영하여 랜덤 생성됩니다.
            </p>

          </div>


          <div>

            <label
              className="
                text-xs
                font-bold
                text-slate-700
              "
            >
              정답 취약점
            </label>


            <select
              value={
                selectedVulnerabilityId
              }
              onChange={
                e =>
                  handleVulnerabilityChange(
                    e.target.value
                  )
              }
              className="
                w-full
                mt-1.5
                px-3.5
                py-3
                text-sm
                rounded-xl
                border
                border-slate-300
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-400
                font-semibold
                text-slate-800
              "
            >

              <option value="">
                정답 취약점을 선택해주세요
              </option>


              {SECURITY_VULNERABILITIES.map(
                item => (

                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.label}
                  </option>

                )
              )}

            </select>

          </div>


          {selectedVulnerability && (

            <div
              className="
                p-4
                rounded-xl
                bg-emerald-50
                border
                border-emerald-100
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-bold
                  text-emerald-800
                  mb-1
                "
              >

                <CheckCircle2
                  className="
                    w-4
                    h-4
                  "
                />

                <span>
                  {selectedVulnerability.label}
                </span>

              </div>


              <p
                className="
                  text-xs
                  sm:text-sm
                  text-emerald-700
                  leading-relaxed
                "
              >
                {selectedVulnerability.description}
              </p>

            </div>
          )}


          {/* =================================================
              4지선다 제외 항목
          ================================================= */}

          <div
            className="
              mt-5
              pt-5
              border-t
              border-slate-100
            "
          >

            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-start
                sm:justify-between
                gap-2
                mb-4
              "
            >

              <div>

                <h4
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  4지선다에서 제외할 항목
                </h4>


                <p
                  className="
                    text-xs
                    text-slate-500
                    leading-relaxed
                    mt-1
                  "
                >
                  이 사진에서도 정답으로 오인될 수 있는 유사 취약점을 선택하세요.
                  선택한 항목은 랜덤 오답 후보에서 제외됩니다.
                </p>

              </div>


              <div
                className="
                  shrink-0
                  px-3
                  py-1.5
                  rounded-full
                  bg-slate-100
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                제외 {excludedChoiceIds.length}개
              </div>

            </div>


            {!selectedVulnerabilityId ? (

              <div
                className="
                  p-4
                  rounded-xl
                  bg-amber-50
                  border
                  border-amber-200
                  text-xs
                  sm:text-sm
                  text-amber-800
                "
              >
                먼저 위에서 정답 취약점을 선택해주세요.
              </div>

            ) : (

              <>
                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-2.5
                  "
                >

                  {SECURITY_VULNERABILITIES.map(
                    item => {

                      const isCorrect =
                        item.id ===
                        selectedVulnerabilityId;


                      const isExcluded =
                        excludedChoiceIds
                          .includes(
                            item.id
                          );


                      return (

                        <label
                          key={
                            item.id
                          }
                          className={`
                            relative
                            flex
                            items-start
                            gap-3
                            p-3.5
                            rounded-xl
                            border
                            transition-all
                            select-none
                            ${
                              isCorrect
                                ? `
                                  bg-emerald-50
                                  border-emerald-200
                                  cursor-not-allowed
                                `
                                : isExcluded
                                  ? `
                                    bg-rose-50
                                    border-rose-300
                                    cursor-pointer
                                  `
                                  : `
                                    bg-white
                                    border-slate-200
                                    hover:border-blue-300
                                    hover:bg-blue-50/40
                                    cursor-pointer
                                  `
                            }
                          `}
                        >

                          <input
                            type="checkbox"
                            checked={
                              isExcluded
                            }
                            disabled={
                              isCorrect
                            }
                            onChange={() =>
                              handleExcludedChoiceToggle(
                                item.id
                              )
                            }
                            className="
                              mt-0.5
                              w-4
                              h-4
                              rounded
                              border-slate-300
                              text-rose-600
                              focus:ring-rose-500
                              shrink-0
                            "
                          />


                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >

                            <div
                              className={`
                                text-xs
                                sm:text-sm
                                font-bold
                                leading-snug
                                ${
                                  isCorrect
                                    ? 'text-emerald-800'
                                    : isExcluded
                                      ? 'text-rose-800'
                                      : 'text-slate-800'
                                }
                              `}
                            >
                              {item.label}
                            </div>


                            <div
                              className="
                                text-[11px]
                                text-slate-500
                                leading-relaxed
                                mt-1
                              "
                            >
                              {
                                isCorrect
                                  ? '현재 정답 — 오답 후보에서 자동 제외됩니다.'
                                  : isExcluded
                                    ? '이 문제의 4지선다 오답 후보에 나오지 않습니다.'
                                    : item.description
                              }
                            </div>

                          </div>

                        </label>

                      );
                    }
                  )}

                </div>


                <div
                  className={`
                    mt-3
                    p-3
                    rounded-xl
                    border
                    text-xs
                    leading-relaxed
                    ${
                      availableDistractorCount >=
                        3
                        ? `
                          bg-blue-50
                          border-blue-100
                          text-blue-800
                        `
                        : `
                          bg-rose-50
                          border-rose-200
                          text-rose-800
                        `
                    }
                  `}
                >
                  현재 사용 가능한 오답 후보는
                  {' '}
                  <strong>
                    {availableDistractorCount}개
                  </strong>
                  입니다.
                  {' '}

                  {
                    availableDistractorCount >=
                      3
                      ? '4지선다 생성이 가능합니다.'
                      : '4지선다 생성을 위해 최소 3개가 필요합니다. 제외 항목을 줄여주세요.'
                  }
                </div>

              </>
            )}

          </div>

        </div>


        {/* ===================================================
            이미지
        =================================================== */}

        <div
          className="
            bg-white
            p-5
            sm:p-6
            rounded-2xl
            border
            border-sky-100
            shadow-sm
            space-y-4
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              border-b
              border-slate-100
              pb-3
            "
          >

            <div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                3. 보안 취약점 이미지
              </h3>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                참가자에게 실제로 보여줄 사진 1장만 등록합니다.
              </p>

            </div>


            {imagePreview && (

              <label
                className="
                  text-xs
                  text-blue-600
                  font-semibold
                  cursor-pointer
                  hover:text-blue-700
                  flex
                  items-center
                  gap-1
                  px-2.5
                  py-1.5
                  rounded-lg
                  hover:bg-blue-50
                  transition-colors
                "
              >

                <Upload
                  className="
                    w-3.5
                    h-3.5
                  "
                />

                이미지 변경


                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleImageFileChange
                  }
                  className="hidden"
                />

              </label>
            )}

          </div>


          {isLoadingExistingImage ? (

            <div
              className="
                w-full
                aspect-[16/9]
                max-h-[560px]
                bg-sky-50/50
                rounded-2xl
                border
                border-sky-100
                flex
                items-center
                justify-center
              "
            >

              <div
                className="
                  flex
                  flex-col
                  items-center
                  gap-2
                  text-slate-500
                "
              >

                <div
                  className="
                    w-8
                    h-8
                    border-2
                    border-blue-200
                    border-t-blue-600
                    rounded-full
                    animate-spin
                  "
                />

                <span
                  className="
                    text-xs
                    font-semibold
                  "
                >
                  이미지 불러오는 중...
                </span>

              </div>

            </div>

          ) : imagePreview ? (

            <div
              className="
                relative
                w-full
                bg-slate-50
                rounded-2xl
                overflow-hidden
                border
                border-slate-200
                flex
                justify-center
              "
            >

              <img
                src={
                  imagePreview
                }
                alt="보안 취약점 이미지 미리보기"
                className="
                  block
                  max-w-full
                  max-h-[560px]
                  object-contain
                "
              />

            </div>

          ) : (

            <label
              className="
                w-full
                aspect-[16/9]
                max-h-[500px]
                rounded-2xl
                border-2
                border-dashed
                border-blue-200
                bg-blue-50/40
                hover:bg-blue-50
                hover:border-blue-300
                flex
                flex-col
                items-center
                justify-center
                cursor-pointer
                transition-colors
                p-6
              "
            >

              <Upload
                className="
                  w-10
                  h-10
                  text-blue-400
                  mb-3
                "
              />


              <span
                className="
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                보안 취약점 사진 업로드
              </span>


              <span
                className="
                  text-xs
                  text-slate-400
                  mt-1
                "
              >
                PNG, JPEG, WEBP
              </span>


              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleImageFileChange
                }
                className="hidden"
              />

            </label>
          )}

        </div>


        {/* ===================================================
            정답 인정 위치
        =================================================== */}

        {imagePreview &&
          !isLoadingExistingImage && (

          <div
            className="
              bg-white
              p-5
              sm:p-6
              rounded-2xl
              border
              border-sky-100
              shadow-sm
              space-y-4
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
                border-b
                border-slate-100
                pb-3
              "
            >

              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-blue-50
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >

                <MousePointer2
                  className="
                    w-4
                    h-4
                    text-blue-600
                  "
                />

              </div>


              <div>

                <h3
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  4. 정답 인정 위치 지정
                </h3>


                <p
                  className="
                    text-xs
                    text-slate-500
                    mt-1
                    leading-relaxed
                  "
                >
                  사진에서 정답으로 인정할 위치를 클릭해주세요.
                  같은 보안 취약점이 여러 곳에 있다면 여러 위치를 등록할 수 있습니다.
                </p>

              </div>

            </div>


            <ImageAnswerEditor
              riskImageSrc={
                imagePreview
              }

              answers={
                answers
              }

              onChangeAnswers={
                handleAnswerChange
              }
            />


            <div
              className={`
                p-3.5
                rounded-xl
                border
                text-xs
                sm:text-sm
                ${
                  answers.length >
                    0
                    ? `
                      bg-emerald-50
                      border-emerald-200
                      text-emerald-800
                    `
                    : `
                      bg-slate-50
                      border-slate-200
                      text-slate-500
                    `
                }
              `}
            >

              {
                answers.length >
                  0
                  ? (
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        font-semibold
                      "
                    >

                      <CheckCircle2
                        className="
                          w-4
                          h-4
                          shrink-0
                        "
                      />


                      <span>
                        정답 인정 위치가
                        {' '}
                        <strong>
                          {answers.length}개
                        </strong>
                        {' '}
                        등록되었습니다.
                        등록된 위치 중 어느 하나를 클릭해도 정답으로 인정됩니다.
                      </span>

                    </div>
                  )
                  : (
                    <span>
                      아직 정답 인정 위치가 지정되지 않았습니다.
                    </span>
                  )
              }

            </div>

          </div>
        )}

      </form>

    </div>
  );
};