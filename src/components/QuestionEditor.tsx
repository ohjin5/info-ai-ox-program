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
} from 'lucide-react';

import {
  resolveQuestionImages,
  type Question,
  type SecurityAnswer,
  type SaveQuestionPayload,
} from '../services/apiService';

import {
  compressAndConvertToBase64,
} from '../utils/imageCompression';

import {
  ImageAnswerEditor,
} from './ImageAnswerEditor';


interface QuestionEditorProps {
  initialData?: Question | null;

  /*
   * AdminPage와의 기존 props 호환을 위해 유지합니다.
   * 실제 저장 인증은 상위 AdminPage에서 처리합니다.
   */
  adminPassword: string;

  onSave: (
    payload: SaveQuestionPayload
  ) => Promise<boolean>;

  onCancel: () => void;
}


export const QuestionEditor:
React.FC<QuestionEditorProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {

  const isEditing =
    Boolean(initialData?.id);


  /* =========================================================
     Form State
  ========================================================= */

  const [
    title,
    setTitle,
  ] = useState(
    initialData?.title || ''
  );


  const [
    timeLimit,
    setTimeLimit,
  ] = useState(
    initialData?.timeLimit || 60
  );


  /*
   * 내부 데이터 구조는 lives 그대로 유지합니다.
   * 화면에서는 "기회"로 표시합니다.
   */
  const [
    lives,
    setLives,
  ] = useState(
    initialData?.lives || 3
  );


  const [
    hintCount,
    setHintCount,
  ] = useState(
    initialData?.hintCount ?? 1
  );


  const [
    active,
    setActive,
  ] = useState(
    initialData?.active ?? true
  );


  /* =========================================================
     Image State
  ========================================================= */

  const [
    normalPreview,
    setNormalPreview,
  ] = useState<string>('');


  const [
    riskPreview,
    setRiskPreview,
  ] = useState<string>('');


  const [
    newNormalFile,
    setNewNormalFile,
  ] = useState<File | null>(
    null
  );


  const [
    newRiskFile,
    setNewRiskFile,
  ] = useState<File | null>(
    null
  );


  const [
    isLoadingExistingImages,
    setIsLoadingExistingImages,
  ] = useState<boolean>(
    false
  );


  const [
    imageLoadError,
    setImageLoadError,
  ] = useState<string | null>(
    null
  );


  /*
   * 새 파일 미리보기용 Object URL
   */
  const normalObjectUrlRef =
    useRef<string | null>(
      null
    );


  const riskObjectUrlRef =
    useRef<string | null>(
      null
    );


  /* =========================================================
     Answer State
  ========================================================= */

  const [
    answers,
    setAnswers,
  ] = useState<SecurityAnswer[]>(
    initialData?.answers || []
  );


  /* =========================================================
     Submit State
  ========================================================= */

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState<boolean>(
    false
  );


  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );


  /* =========================================================
     기존 문제 데이터 동기화
  ========================================================= */

  useEffect(() => {

    let cancelled = false;


    const loadInitialData =
      async () => {

        /*
         * 기존 Object URL 정리
         */
        if (
          normalObjectUrlRef.current
        ) {

          URL.revokeObjectURL(
            normalObjectUrlRef.current
          );

          normalObjectUrlRef.current =
            null;
        }


        if (
          riskObjectUrlRef.current
        ) {

          URL.revokeObjectURL(
            riskObjectUrlRef.current
          );

          riskObjectUrlRef.current =
            null;
        }


        /*
         * Form 초기화
         */
        setTitle(
          initialData?.title || ''
        );


        setTimeLimit(
          initialData?.timeLimit || 60
        );


        setLives(
          initialData?.lives || 3
        );


        setHintCount(
          initialData?.hintCount ?? 1
        );


        setActive(
          initialData?.active ?? true
        );


        setAnswers(
          initialData?.answers || []
        );


        setNewNormalFile(
          null
        );


        setNewRiskFile(
          null
        );


        setNormalPreview(
          ''
        );


        setRiskPreview(
          ''
        );


        setImageLoadError(
          null
        );


        /*
         * 신규 문제
         */
        if (!initialData) {

          setIsLoadingExistingImages(
            false
          );

          return;
        }


        /*
         * 기존 문제 이미지 조회
         *
         * Drive fileId
         *      ↓
         * Apps Script
         *      ↓
         * Base64 Data URL
         */
        setIsLoadingExistingImages(
          true
        );


        try {

          const result =
            await resolveQuestionImages(
              initialData
            );


          if (cancelled) {
            return;
          }


          if (
            result.success &&
            result.data
          ) {

            setNormalPreview(
              result.data.normalImageSrc
            );


            setRiskPreview(
              result.data.riskImageSrc
            );

          } else {

            setImageLoadError(
              result.error ||
              '기존 이미지를 불러오지 못했습니다.'
            );
          }

        } catch (error) {

          console.error(
            '기존 문제 이미지 조회 오류:',
            error
          );


          if (!cancelled) {

            setImageLoadError(
              '기존 이미지를 불러오는 중 오류가 발생했습니다.'
            );
          }

        } finally {

          if (!cancelled) {

            setIsLoadingExistingImages(
              false
            );
          }
        }
      };


    void loadInitialData();


    return () => {

      cancelled = true;
    };

  }, [
    initialData,
  ]);


  /* =========================================================
     Unmount Cleanup
  ========================================================= */

  useEffect(() => {

    return () => {

      if (
        normalObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          normalObjectUrlRef.current
        );
      }


      if (
        riskObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          riskObjectUrlRef.current
        );
      }
    };

  }, []);


  /* =========================================================
     정상 이미지 변경
  ========================================================= */

  const handleNormalFileChange =
    (
      e:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        e.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        normalObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          normalObjectUrlRef.current
        );
      }


      const objectUrl =
        URL.createObjectURL(
          file
        );


      normalObjectUrlRef.current =
        objectUrl;


      setNewNormalFile(
        file
      );


      setNormalPreview(
        objectUrl
      );


      setImageLoadError(
        null
      );


      /*
       * 동일 파일 재선택 허용
       */
      e.target.value = '';
    };


  /* =========================================================
     위험 이미지 변경
  ========================================================= */

  const handleRiskFileChange =
    (
      e:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        e.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        riskObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          riskObjectUrlRef.current
        );
      }


      const objectUrl =
        URL.createObjectURL(
          file
        );


      riskObjectUrlRef.current =
        objectUrl;


      setNewRiskFile(
        file
      );


      setRiskPreview(
        objectUrl
      );


      setImageLoadError(
        null
      );


      e.target.value = '';
    };


  /* =========================================================
     저장
  ========================================================= */

  const handleSubmit =
    async (
      e: React.FormEvent
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
        !normalPreview
      ) {

        setErrorMessage(
          '정상 이미지를 선택해주세요.'
        );

        return;
      }


      if (
        !riskPreview
      ) {

        setErrorMessage(
          '보안 이슈 이미지를 선택해주세요.'
        );

        return;
      }


      if (
        answers.length === 0
      ) {

        setErrorMessage(
          '보안 위험 정답을 최소 1개 이상 이미지에 등록해주세요.'
        );

        return;
      }


      setIsSubmitting(
        true
      );


      try {

        let normalBase64:
          string |
          undefined;


        let riskBase64:
          string |
          undefined;


        /*
         * 새 이미지가 선택된 경우에만
         * 압축 후 Base64 변환
         */
        if (
          newNormalFile
        ) {

          normalBase64 =
            await compressAndConvertToBase64(
              newNormalFile
            );
        }


        if (
          newRiskFile
        ) {

          riskBase64 =
            await compressAndConvertToBase64(
              newRiskFile
            );
        }


        /*
         * 새 이미지가 없으면
         * 기존 Drive fileId 유지
         *
         * 새 이미지가 있으면
         * Base64 → Apps Script → Drive 저장
         */
        const payload:
          SaveQuestionPayload = {

          id:
            initialData?.id,


          title:
            title.trim(),


          normalImageBase64:
            normalBase64,


          riskImageBase64:
            riskBase64,


          normalImageUrl:
            !normalBase64
              ? initialData
                  ?.normalImageUrl
              : undefined,


          normalImageId:
            !normalBase64
              ? initialData
                  ?.normalImageId
              : undefined,


          riskImageUrl:
            !riskBase64
              ? initialData
                  ?.riskImageUrl
              : undefined,


          riskImageId:
            !riskBase64
              ? initialData
                  ?.riskImageId
              : undefined,


          answers,


          timeLimit:
            Number(
              timeLimit
            ) || 60,


          /*
           * 서버/시트 구조는 lives 유지
           */
          lives:
            Number(
              lives
            ) || 3,


          /*
           * 힌트 0회 허용
           */
          hintCount:
            Number.isFinite(
              Number(
                hintCount
              )
            )
              ? Number(
                  hintCount
                )
              : 1,


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
                    ? '문제 수정'
                    : '새 문제 등록'
                }
              </h2>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                정상 및 보안 위험 이미지를 등록하고 정답 위치를 지정합니다.
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
                isLoadingExistingImages
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
                        저장 중입니다...
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
            Basic Information
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
              기본 정보 및 게임 규칙
            </h3>


            <p
              className="
                text-xs
                text-slate-500
                mt-1
              "
            >
              문제명과 제한시간, 기회 및 힌트 횟수를 설정합니다.
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-4
            "
          >

            {/* 문제명 */}

            <div>

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                문제명
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
                placeholder="예: 간호사 스테이션 보안 위험 찾기 01"
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


            {/* 활성화 */}

            <div
              className="
                flex
                items-center
                pt-5
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
                  "
                >
                  문제 활성화 (게임 출제 여부)
                </span>

              </label>

            </div>

          </div>


          {/* 게임 설정 */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-4
              pt-1
            "
          >

            {/* 제한시간 */}

            <div>

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                제한시간 (초)
              </label>


              <input
                type="number"
                min="10"
                max="300"
                value={
                  timeLimit
                }
                onChange={
                  e =>
                    setTimeLimit(
                      parseInt(
                        e.target.value,
                        10
                      ) || 60
                    )
                }
                className="
                  w-full
                  mt-1.5
                  px-3
                  py-2.5
                  text-sm
                  rounded-xl
                  border
                  border-slate-300
                  bg-sky-50/30
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-400
                  font-mono
                "
              />

              <p
                className="
                  text-[11px]
                  text-slate-400
                  mt-1
                "
              >
                참가자에게 제공할 제한시간
              </p>

            </div>


            {/* 기회 */}

            <div>

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                기회 횟수
              </label>


              <input
                type="number"
                min="1"
                max="10"
                value={
                  lives
                }
                onChange={
                  e =>
                    setLives(
                      parseInt(
                        e.target.value,
                        10
                      ) || 3
                    )
                }
                className="
                  w-full
                  mt-1.5
                  px-3
                  py-2.5
                  text-sm
                  rounded-xl
                  border
                  border-slate-300
                  bg-rose-50/30
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-400
                  font-mono
                "
              />

              <p
                className="
                  text-[11px]
                  text-slate-400
                  mt-1
                "
              >
                오답 선택 시 1회씩 차감
              </p>

            </div>


            {/* 힌트 */}

            <div>

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                힌트 횟수
              </label>


              <input
                type="number"
                min="0"
                max="5"
                value={
                  hintCount
                }
                onChange={
                  e =>
                    setHintCount(
                      Number(
                        e.target.value
                      )
                    )
                }
                className="
                  w-full
                  mt-1.5
                  px-3
                  py-2.5
                  text-sm
                  rounded-xl
                  border
                  border-slate-300
                  bg-amber-50/30
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-400
                  font-mono
                "
              />

              <p
                className="
                  text-[11px]
                  text-slate-400
                  mt-1
                "
              >
                0회로 설정하면 힌트 미제공
              </p>

            </div>

          </div>

        </div>


        {/* ===================================================
            Image Upload
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
          "
        >

          {/* =================================================
              Normal Image
          ================================================= */}

          <div
            className="
              bg-white
              p-5
              rounded-2xl
              border
              border-sky-100
              shadow-sm
              space-y-3
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div>

                <div
                  className="
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  1. 정상 이미지
                </div>

                <div
                  className="
                    text-[11px]
                    text-slate-400
                    mt-0.5
                  "
                >
                  보안 위험이 없는 기준 사진
                </div>

              </div>


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

                <span>
                  파일 변경
                </span>


                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleNormalFileChange
                  }
                  className="hidden"
                />

              </label>

            </div>


            {isLoadingExistingImages ? (

              <div
                className="
                  w-full
                  aspect-[3/2]
                  bg-sky-50/50
                  rounded-xl
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
                      w-7
                      h-7
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

            ) : normalPreview ? (

              <div
                className="
                  relative
                  w-full
                  aspect-[3/2]
                  bg-slate-50
                  rounded-xl
                  overflow-hidden
                  border
                  border-slate-200
                "
              >

                <img
                  src={
                    normalPreview
                  }
                  alt="정상 이미지 미리보기"
                  className="
                    w-full
                    h-full
                    object-contain
                  "
                />

              </div>

            ) : (

              <label
                className="
                  w-full
                  aspect-[3/2]
                  rounded-xl
                  border-2
                  border-dashed
                  border-sky-200
                  bg-sky-50/40
                  hover:bg-sky-50
                  hover:border-blue-300
                  flex
                  flex-col
                  items-center
                  justify-center
                  cursor-pointer
                  transition-colors
                  p-4
                "
              >

                <Upload
                  className="
                    w-8
                    h-8
                    text-blue-400
                    mb-2
                  "
                />


                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-700
                  "
                >
                  정상 이미지 업로드
                </span>


                <span
                  className="
                    text-[11px]
                    text-slate-400
                    mt-0.5
                  "
                >
                  PNG, JPEG, WEBP 지원
                </span>


                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleNormalFileChange
                  }
                  className="hidden"
                />

              </label>
            )}

          </div>


          {/* =================================================
              Risk Image
          ================================================= */}

          <div
            className="
              bg-white
              p-5
              rounded-2xl
              border
              border-blue-100
              shadow-sm
              space-y-3
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div>

                <div
                  className="
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  2. 보안 위험 이미지
                </div>


                <div
                  className="
                    text-[11px]
                    text-slate-400
                    mt-0.5
                  "
                >
                  참가자가 위험 요소를 찾을 사진
                </div>

              </div>


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

                <span>
                  파일 변경
                </span>


                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleRiskFileChange
                  }
                  className="hidden"
                />

              </label>

            </div>


            {isLoadingExistingImages ? (

              <div
                className="
                  w-full
                  aspect-[3/2]
                  bg-sky-50/50
                  rounded-xl
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
                      w-7
                      h-7
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

            ) : riskPreview ? (

              <div
                className="
                  relative
                  w-full
                  aspect-[3/2]
                  bg-slate-50
                  rounded-xl
                  overflow-hidden
                  border
                  border-slate-200
                "
              >

                <img
                  src={
                    riskPreview
                  }
                  alt="보안 위험 이미지 미리보기"
                  className="
                    w-full
                    h-full
                    object-contain
                  "
                />

              </div>

            ) : (

              <label
                className="
                  w-full
                  aspect-[3/2]
                  rounded-xl
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
                  p-4
                "
              >

                <Upload
                  className="
                    w-8
                    h-8
                    text-blue-400
                    mb-2
                  "
                />


                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-700
                  "
                >
                  보안 위험 이미지 업로드
                </span>


                <span
                  className="
                    text-[11px]
                    text-slate-400
                    mt-0.5
                  "
                >
                  PNG, JPEG, WEBP 지원
                </span>


                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleRiskFileChange
                  }
                  className="hidden"
                />

              </label>
            )}

          </div>

        </div>


        {/* ===================================================
            Answer Coordinate Editor
        =================================================== */}

        {riskPreview &&
          !isLoadingExistingImages && (

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
                  text-base
                  font-bold
                  text-slate-900
                "
              >
                정답 위치 지정 및 판정 영역 설정
              </h3>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                위험 이미지에서 정답 위치를 클릭하여 보안 위험 항목을 등록합니다.
              </p>

            </div>


            <ImageAnswerEditor
              riskImageSrc={
                riskPreview
              }

              answers={
                answers
              }

              onChangeAnswers={
                setAnswers
              }
            />

          </div>
        )}

      </form>

    </div>
  );
};