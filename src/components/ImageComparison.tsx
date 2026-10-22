import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Crosshair,
  Search,
  ShieldAlert,
} from 'lucide-react';

import type {
  SecurityAnswer,
} from '../services/apiService';

import {
  getRenderedImageBounds,
  clientPointToImagePercent,
  type RenderedImageBounds,
} from '../utils/imageCoordinates';

import {
  WrongClickMarker,
} from './AnswerMarker';


/* =========================================================
   Props
========================================================= */

interface ImageComparisonProps {

  /*
   * 참가자에게 보여줄
   * 보안 취약점 이미지 1장
   */
  imageUrl:
    string;


  /*
   * 해당 사진에서
   * 정답으로 인정할 위치 전체
   *
   * ex)
   * answers[0] = 왼쪽 모니터
   * answers[1] = 오른쪽 모니터
   *
   * 둘 중 하나만 눌러도 정답
   */
  answers:
    SecurityAnswer[];


  /*
   * 현재 사진에서
   * 위치를 이미 찾았는지 여부
   */
  locationFound:
    boolean;


  /*
   * 위치 정답
   *
   * 실제로 사용자가 누른
   * 정답 위치 정보를 전달
   */
  onLocationFound: (
    answer:
      SecurityAnswer
  ) => void;


  /*
   * 위치 오답
   */
  onWrongClick:
    () => void;


  /*
   * 정답 위치 발견 후
   * 또는 게임 종료 시 이미지 클릭 잠금
   */
  isLocked:
    boolean;
}


/* =========================================================
   ImageComparison
========================================================= */

export const ImageComparison:
React.FC<ImageComparisonProps> = ({

  imageUrl,

  answers,

  locationFound,

  onLocationFound,

  onWrongClick,

  isLocked,

}) => {

  /* =========================================================
     Refs
  ========================================================= */

  const imgRef =
    useRef<HTMLImageElement>(
      null
    );


  /*
   * 연속 클릭 방지
   */
  const clickLockRef =
    useRef<boolean>(
      false
    );


  const wrongClickTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > |
      null
    >(
      null
    );


  /* =========================================================
     이미지 실제 렌더링 영역
  ========================================================= */

  const [
    imageBounds,
    setImageBounds,
  ] =
    useState<
      RenderedImageBounds |
      null
    >(
      null
    );


  /* =========================================================
     실제로 맞힌 위치

     중요:
     locationFound=true가 되었을 때
     사용자가 어떤 위치를 눌렀는지 표시하기 위함
  ========================================================= */

  const [
    matchedAnswer,
    setMatchedAnswer,
  ] =
    useState<
      SecurityAnswer |
      null
    >(
      null
    );


  /* =========================================================
     오답 클릭 위치
  ========================================================= */

  const [
    wrongClickPoint,
    setWrongClickPoint,
  ] =
    useState<{
      x:
        number;

      y:
        number;
    } | null>(
      null
    );


  /* =========================================================
     Bounds 업데이트
  ========================================================= */

  const updateImageBounds =
    useCallback(
      () => {

        if (
          !imgRef.current
        ) {

          return;
        }


        const bounds =
          getRenderedImageBounds(
            imgRef.current
          );


        setImageBounds(
          bounds
        );
      },
      []
    );


  /* =========================================================
     Resize
  ========================================================= */

  useEffect(
    () => {

      updateImageBounds();


      window.addEventListener(
        'resize',
        updateImageBounds
      );


      return () => {

        window.removeEventListener(
          'resize',
          updateImageBounds
        );
      };

    },
    [
      updateImageBounds,
    ]
  );


  /* =========================================================
     문제 변경
  ========================================================= */

  useEffect(
    () => {

      /*
       * 이전 문제 흔적 제거
       */
      setWrongClickPoint(
        null
      );


      setMatchedAnswer(
        null
      );


      clickLockRef.current =
        false;


      /*
       * 이미지 DOM 렌더링 이후
       * Bounds 다시 계산
       */
      const timer =
        window.setTimeout(
          () => {

            updateImageBounds();

          },
          0
        );


      return () => {

        window.clearTimeout(
          timer
        );
      };

    },
    [
      imageUrl,
      updateImageBounds,
    ]
  );


  /* =========================================================
     locationFound가 다시 false가 되면
     다음 문제 준비
  ========================================================= */

  useEffect(
    () => {

      if (
        !locationFound
      ) {

        setMatchedAnswer(
          null
        );


        clickLockRef.current =
          false;
      }

    },
    [
      locationFound,
    ]
  );


  /* =========================================================
     Cleanup
  ========================================================= */

  useEffect(
    () => {

      return () => {

        if (
          wrongClickTimeoutRef.current
        ) {

          clearTimeout(
            wrongClickTimeoutRef.current
          );
        }
      };

    },
    []
  );


  /* =========================================================
     특정 Answer 안에 클릭했는지 확인

     주의:
     관리자 화면의 원과 동일하게
     radius는 이미지 너비 기준 %로 사용

     X/Y를 실제 렌더링 px로 변환해서
     판정하기 때문에 세로/가로 비율이 달라도
     화면에 그려진 원과 실제 클릭 범위가 일치함
  ========================================================= */

  const isPointInsideAnswer =
    (
      clickX:
        number,

      clickY:
        number,

      answer:
        SecurityAnswer
    ):
      boolean => {

    if (
      !imageBounds
    ) {

      /*
       * Bounds가 아직 없다면
       * 기존 퍼센트 방식으로 fallback
       */
      const dx =
        clickX -
        answer.x;


      const dy =
        clickY -
        answer.y;


      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );


      return (
        distance <=
        answer.radius
      );
    }


    /*
     * 이미지 퍼센트 좌표 → 실제 픽셀 거리
     */
    const dxPx =
      (
        (
          clickX -
          answer.x
        ) /
        100
      ) *
      imageBounds.renderedWidth;


    const dyPx =
      (
        (
          clickY -
          answer.y
        ) /
        100
      ) *
      imageBounds.renderedHeight;


    /*
     * 관리자에서 radius는
     * 이미지 너비의 % 기준
     */
    const radiusPx =
      (
        answer.radius /
        100
      ) *
      imageBounds.renderedWidth;


    const distancePx =
      Math.sqrt(
        dxPx * dxPx +
        dyPx * dyPx
      );


    return (
      distancePx <=
      radiusPx
    );
  };


  /* =========================================================
     이미지 클릭
  ========================================================= */

  const handleImageClick =
    (
      e:
        React.MouseEvent<HTMLDivElement>
    ) => {

      /* -------------------------------------------------------
         잠금
      ------------------------------------------------------- */

      if (
        isLocked ||
        locationFound ||
        clickLockRef.current
      ) {

        return;
      }


      const img =
        imgRef.current;


      if (
        !img
      ) {

        return;
      }


      /* -------------------------------------------------------
         실제 사진 내부 좌표 계산
      ------------------------------------------------------- */

      const point =
        clientPointToImagePercent(
          e.clientX,
          e.clientY,
          img
        );


      /*
       * object-fit contain 여백 클릭 무시
       */
      if (
        !point
      ) {

        return;
      }


      const {
        x:
          clickX,

        y:
          clickY,
      } =
        point;


      /* -------------------------------------------------------
         등록된 모든 정답 위치 검사

         ★ 핵심

         정답 인정 위치가

         ① 왼쪽 모니터
         ② 오른쪽 모니터

         두 개라면 둘 중 하나만 맞아도
         matched가 반환됩니다.
      ------------------------------------------------------- */

      const matched =
        answers.find(
          answer =>
            isPointInsideAnswer(
              clickX,
              clickY,
              answer
            )
        );


      /* -------------------------------------------------------
         위치 정답
      ------------------------------------------------------- */

      if (
        matched
      ) {

        clickLockRef.current =
          true;


        /*
         * 실제로 맞힌 원 저장
         */
        setMatchedAnswer(
          matched
        );


        /*
         * GamePage로 전달
         *
         * 이후:
         * locationFound = true
         * 4지선다 표시
         */
        onLocationFound(
          matched
        );


        /*
         * state 반영 후 내부 lock 해제
         *
         * 부모의 locationFound=true가
         * 이후 클릭을 계속 막음
         */
        window.setTimeout(
          () => {

            clickLockRef.current =
              false;

          },
          250
        );


        return;
      }


      /* -------------------------------------------------------
         위치 오답
      ------------------------------------------------------- */

      clickLockRef.current =
        true;


      setWrongClickPoint({

        x:
          clickX,

        y:
          clickY,
      });


      onWrongClick();


      /*
       * 기존 오답 타이머 정리
       */
      if (
        wrongClickTimeoutRef.current
      ) {

        clearTimeout(
          wrongClickTimeoutRef.current
        );
      }


      /*
       * 빨간 오답 표시 후 제거
       */
      wrongClickTimeoutRef.current =
        setTimeout(
          () => {

            setWrongClickPoint(
              null
            );


            clickLockRef.current =
              false;

          },
          500
        );
    };


  /* =========================================================
     표시할 발견 위치

     정상적인 경우 matchedAnswer 사용

     혹시 외부 상태만 locationFound=true가 된 경우에는
     첫 번째 답을 fallback으로 사용
  ========================================================= */

  const displayedMatchedAnswer =
    matchedAnswer ||
    (
      locationFound
        ? answers[0] ||
          null
        : null
    );


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        flex-1
        min-h-0
        flex
        flex-col
        items-center
        justify-center
        px-3
        sm:px-5
        md:px-7
        pt-10
        sm:pt-12
        pb-3
        overflow-hidden
        bg-gradient-to-b
        from-sky-50/70
        via-white
        to-white
      "
    >

      {/* =====================================================
          상단 안내
      ===================================================== */}

      <div
        className="
          w-full
          max-w-[1600px]
          mb-3
          sm:mb-4
          flex
          flex-col
          sm:flex-row
          sm:items-center
          justify-between
          gap-2
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <div
            className="
              w-9
              h-9
              rounded-xl
              bg-blue-50
              border
              border-blue-100
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <Search
              className="
                w-4
                h-4
                text-blue-600
              "
            />

          </div>


          <div>

            <h2
              className="
                text-sm
                sm:text-base
                font-black
                text-slate-900
              "
            >
              사진 속 보안 취약점을 찾아보세요
            </h2>


            <p
              className="
                text-[11px]
                sm:text-xs
                text-slate-500
                mt-0.5
              "
            >
              취약하다고 생각되는 부분을 직접 클릭해주세요.
            </p>

          </div>

        </div>


        <div
          className="
            hidden
            sm:inline-flex
            items-center
            gap-1.5
            px-3
            py-1.5
            rounded-full
            bg-white
            border
            border-sky-100
            shadow-sm
            text-xs
            font-bold
            text-blue-700
          "
        >

          <Crosshair
            className="
              w-3.5
              h-3.5
            "
          />

          위치를 먼저 찾아야 합니다

        </div>

      </div>


      {/* =====================================================
          메인 이미지
      ===================================================== */}

      <div
        className="
          w-full
          max-w-[1600px]
          flex-1
          min-h-0
          flex
          items-center
          justify-center
        "
      >

        <div
          className={`
            relative
            w-full
            flex-1
            min-h-0
            max-h-[calc(100vh-145px)]
            rounded-3xl
            bg-white
            overflow-hidden
            border-2
            shadow-xl
            shadow-blue-100/60
            flex
            items-center
            justify-center
            select-none
            transition-all
            ${
              isLocked ||
              locationFound
                ? `
                  border-slate-200
                  cursor-default
                `
                : `
                  border-blue-200
                  hover:border-blue-400
                  cursor-crosshair
                `
            }
          `}
          onClick={
            handleImageClick
          }
        >

          {/* =================================================
              Badge
          ================================================= */}

          <div
            className="
              absolute
              top-3
              left-3
              sm:top-4
              sm:left-4
              z-20
              pointer-events-none
            "
          >

            <div
              className="
                inline-flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded-full
                bg-blue-600/95
                text-white
                text-[11px]
                sm:text-xs
                font-black
                shadow-md
                backdrop-blur
              "
            >

              <ShieldAlert
                className="
                  w-3.5
                  h-3.5
                "
              />

              보안 위험 찾기

            </div>

          </div>


          {/* =================================================
              Image
          ================================================= */}

          <img
            ref={
              imgRef
            }
            src={
              imageUrl
            }
            alt="보안 취약점 찾기"
            className="
              block
              w-auto
              h-auto
              max-w-full
              max-h-full
              object-contain
              pointer-events-none
              select-none
            "
            referrerPolicy="no-referrer"
            draggable={
              false
            }
            onLoad={
              updateImageBounds
            }
          />


          {/* =================================================
              실제 이미지 영역 Overlay
          ================================================= */}

          {imageBounds && (

            <div
              className="
                absolute
                pointer-events-none
              "
              style={{

                left:
                  `${imageBounds.offsetX}px`,

                top:
                  `${imageBounds.offsetY}px`,

                width:
                  `${imageBounds.renderedWidth}px`,

                height:
                  `${imageBounds.renderedHeight}px`,
              }}
            >

              {/* =============================================
                  실제로 클릭한 정답 위치만 표시

                  등록된 정답 위치가 2개여도
                  사용자가 누른 위치 하나만 초록색으로 표시
              ============================================= */}

              {locationFound &&
                displayedMatchedAnswer && (

                <div
                  className="
                    absolute
                    -translate-x-1/2
                    -translate-y-1/2
                    flex
                    items-center
                    justify-center
                  "
                  style={{

                    left:
                      `${displayedMatchedAnswer.x}%`,

                    top:
                      `${displayedMatchedAnswer.y}%`,

                    width:
                      `${
                        displayedMatchedAnswer.radius *
                        2
                      }%`,

                    height:
                      `${
                        displayedMatchedAnswer.radius *
                        2 *
                        (
                          imageBounds.renderedWidth /
                          imageBounds.renderedHeight
                        )
                      }%`,
                  }}
                >

                  <div
                    className="
                      w-full
                      h-full
                      rounded-full
                      bg-emerald-500/20
                      border-[3px]
                      border-emerald-500
                      ring-4
                      ring-emerald-400/20
                      shadow-lg
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <div
                      className="
                        w-9
                        h-9
                        sm:w-11
                        sm:h-11
                        rounded-full
                        bg-emerald-500
                        text-white
                        flex
                        items-center
                        justify-center
                        shadow-lg
                      "
                    >

                      <Crosshair
                        className="
                          w-5
                          h-5
                          sm:w-6
                          sm:h-6
                        "
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* =============================================
                  오답 클릭
              ============================================= */}

              {wrongClickPoint && (

                <WrongClickMarker
                  x={
                    wrongClickPoint.x
                  }

                  y={
                    wrongClickPoint.y
                  }
                />

              )}

            </div>

          )}


          {/* =================================================
              위치 찾은 후 안내
          ================================================= */}

          {locationFound && (

            <div
              className="
                absolute
                inset-x-0
                bottom-4
                z-20
                flex
                justify-center
                pointer-events-none
              "
            >

              <div
                className="
                  px-4
                  py-2
                  rounded-full
                  bg-emerald-600/95
                  text-white
                  text-xs
                  sm:text-sm
                  font-black
                  shadow-lg
                  backdrop-blur
                "
              >
                위치를 찾았습니다! 취약점 종류를 선택해주세요.
              </div>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          하단 안내
      ===================================================== */}

      {!locationFound && (

        <div
          className="
            mt-3
            sm:mt-4
            flex
            items-center
            justify-center
            gap-2
            text-[11px]
            sm:text-xs
            text-slate-500
          "
        >

          <Crosshair
            className="
              w-3.5
              h-3.5
              text-blue-500
            "
          />


          <span>
            보안상 문제가 있다고 생각되는 지점을 클릭하세요.
          </span>

        </div>

      )}

    </div>
  );
};