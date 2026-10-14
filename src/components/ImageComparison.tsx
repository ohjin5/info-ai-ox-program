import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  CheckCircle2,
  Search,
  ShieldCheck,
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
  AnswerMarker,
  WrongClickMarker,
} from './AnswerMarker';


interface ImageComparisonProps {
  normalImageUrl: string;
  riskImageUrl: string;
  answers: SecurityAnswer[];
  foundAnswerIds: number[];

  onCorrectAnswer: (
    answer: SecurityAnswer
  ) => void;

  onWrongClick: () => void;

  activeExplanation: {
    title: string;
    text: string;
  } | null;

  isGameOver: boolean;
}


export const ImageComparison:
React.FC<ImageComparisonProps> = ({
  normalImageUrl,
  riskImageUrl,
  answers,
  foundAnswerIds,
  onCorrectAnswer,
  onWrongClick,
  activeExplanation,
  isGameOver,
}) => {

  const riskImgRef =
    useRef<HTMLImageElement>(
      null
    );

  const clickLockRef =
    useRef<boolean>(
      false
    );


  /* =========================================================
     위험 이미지 실제 렌더링 영역
  ========================================================= */

  const [
    riskBounds,
    setRiskBounds,
  ] =
    useState<
      RenderedImageBounds |
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
      x: number;
      y: number;
    } | null>(
      null
    );


  /* =========================================================
     이미지 Bounds 계산
  ========================================================= */

  const updateRiskBounds =
    useCallback(
      () => {

        if (
          riskImgRef.current
        ) {

          const bounds =
            getRenderedImageBounds(
              riskImgRef.current
            );

          setRiskBounds(
            bounds
          );
        }
      },
      []
    );


  useEffect(
    () => {

      updateRiskBounds();

      window.addEventListener(
        'resize',
        updateRiskBounds
      );

      return () => {

        window.removeEventListener(
          'resize',
          updateRiskBounds
        );
      };

    },
    [
      updateRiskBounds,
    ]
  );


  /* =========================================================
     위험 이미지 클릭
  ========================================================= */

  const handleRiskClick =
    (
      e:
        React.MouseEvent<HTMLDivElement>
    ) => {

      /*
       * 게임 종료 또는
       * 정답 안내 표시 중에는 클릭하지 않음
       */
      if (
        isGameOver ||
        clickLockRef.current ||
        activeExplanation
      ) {
        return;
      }


      const img =
        riskImgRef.current;


      if (!img) {
        return;
      }


      /*
       * object-fit contain 기준
       * 실제 사진 안의 좌표를 0~100%로 변환
       */
      const point =
        clientPointToImagePercent(
          e.clientX,
          e.clientY,
          img
        );


      /*
       * 사진 바깥 여백 클릭 무시
       */
      if (!point) {
        return;
      }


      const {
        x: clickX,
        y: clickY,
      } = point;


      /* -------------------------------------------------------
         정답 판정
      ------------------------------------------------------- */

      let matchedAnswer:
        SecurityAnswer |
        null =
          null;


      for (
        const ans of answers
      ) {

        const dx =
          clickX -
          ans.x;

        const dy =
          clickY -
          ans.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );


        if (
          distance <=
          ans.radius
        ) {

          matchedAnswer =
            ans;

          break;
        }
      }


      /* -------------------------------------------------------
         정답
      ------------------------------------------------------- */

      if (
        matchedAnswer
      ) {

        /*
         * 이미 찾은 정답은 무시
         * 기회도 차감하지 않음
         */
        if (
          foundAnswerIds.includes(
            matchedAnswer.id
          )
        ) {
          return;
        }


        onCorrectAnswer(
          matchedAnswer
        );

        return;
      }


      /* -------------------------------------------------------
         오답
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
     Render
  ========================================================= */

  return (

    <div
      className="
        w-full
        flex-1
        flex
        flex-col
        justify-center
        items-center
        px-2
        sm:px-4
        md:px-6
        py-2
        overflow-hidden
        relative
        bg-gradient-to-b
        from-sky-50/70
        via-white
        to-white
      "
    >

      {/* =====================================================
          비교 이미지 영역
      ===================================================== */}

      <div
        className="
          w-[98%]
          max-w-[2600px]
          h-[78vh]
          sm:h-[80vh]
          lg:h-[82vh]
          grid
          grid-cols-1
          md:grid-cols-2
          items-center
          justify-center
        "
        style={{
          gap:
            'clamp(8px, 1.2vw, 22px)',
        }}
      >

        {/* ===================================================
            기준 이미지
        =================================================== */}

        <div
          className="
            relative
            w-full
            h-full
            rounded-3xl
            bg-white
            border
            border-sky-100
            overflow-hidden
            flex
            items-center
            justify-center
            shadow-lg
            shadow-sky-100/60
            min-w-0
          "
        >

          {/* 기준 이미지 Badge */}

          <div
            className="
              absolute
              top-3
              left-3
              z-10
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
                bg-white/90
                border
                border-sky-100
                shadow-sm
                text-[11px]
                sm:text-xs
                font-bold
                text-slate-600
                backdrop-blur-sm
              "
            >

              <ShieldCheck
                className="
                  w-3.5
                  h-3.5
                  text-blue-600
                "
              />

              <span>
                기준 이미지
              </span>

            </div>

          </div>


          <img
            src={
              normalImageUrl
            }
            alt="정상 이미지"
            className="
              w-full
              h-full
              max-h-[82vh]
              object-contain
              pointer-events-none
              select-none
            "
            referrerPolicy="no-referrer"
            draggable={
              false
            }
          />

        </div>


        {/* ===================================================
            위험 이미지
        =================================================== */}

        <div
          className={`
            relative
            w-full
            h-full
            rounded-3xl
            bg-white
            border-2
            overflow-hidden
            flex
            items-center
            justify-center
            shadow-lg
            shadow-blue-100/70
            select-none
            min-w-0
            transition-colors
            ${
              activeExplanation
                ? `
                  border-blue-200
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
            handleRiskClick
          }
        >

          {/* 위험 찾기 Badge */}

          <div
            className="
              absolute
              top-3
              left-3
              z-10
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
                shadow-sm
                text-[11px]
                sm:text-xs
                font-bold
                text-white
                backdrop-blur-sm
              "
            >

              <Search
                className="
                  w-3.5
                  h-3.5
                "
              />

              <span>
                위험 요소 찾기
              </span>

            </div>

          </div>


          <img
            ref={
              riskImgRef
            }
            src={
              riskImageUrl
            }
            alt="보안 위험 이미지"
            className="
              w-full
              h-full
              max-h-[82vh]
              object-contain
              pointer-events-none
              select-none
            "
            referrerPolicy="no-referrer"
            draggable={
              false
            }
            onLoad={
              updateRiskBounds
            }
          />


          {/* =================================================
              실제 이미지 영역 Overlay
          ================================================= */}

          {riskBounds && (

            <div
              className="
                absolute
                pointer-events-none
              "
              style={{
                left:
                  `${riskBounds.offsetX}px`,

                top:
                  `${riskBounds.offsetY}px`,

                width:
                  `${riskBounds.renderedWidth}px`,

                height:
                  `${riskBounds.renderedHeight}px`,
              }}
            >

              {/* 찾은 정답 */}

              {answers
                .filter(
                  ans =>
                    foundAnswerIds.includes(
                      ans.id
                    )
                )
                .map(
                  ans => (

                    <AnswerMarker
                      key={
                        ans.id
                      }
                      answer={
                        ans
                      }
                    />
                  )
                )}


              {/* 오답 클릭 */}

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

        </div>

      </div>


      {/* =====================================================
          중앙 정답 안내

          중요:
          pointer-events-none을 사용하지 않습니다.
          정답 설명이 표시되는 동안 뒤쪽 클릭 차단
      ===================================================== */}

      {activeExplanation && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            px-4
            bg-slate-900/15
            backdrop-blur-[2px]
            animate-fade-in
            cursor-default
          "
        >

          <div
            className="
              w-full
              max-w-2xl
              sm:max-w-3xl
              animate-scale-in
            "
          >

            <div
              className="
                relative
                overflow-hidden
                bg-white/97
                backdrop-blur-xl
                rounded-3xl
                border-2
                border-emerald-200
                shadow-2xl
                shadow-emerald-200/60
                px-6
                py-7
                sm:px-10
                sm:py-9
                text-center
              "
            >

              {/* 배경 장식 */}

              <div
                className="
                  absolute
                  -top-12
                  -left-12
                  w-40
                  h-40
                  rounded-full
                  bg-emerald-100/60
                  blur-3xl
                  pointer-events-none
                "
              />


              <div
                className="
                  absolute
                  -bottom-14
                  -right-10
                  w-44
                  h-44
                  rounded-full
                  bg-sky-100/70
                  blur-3xl
                  pointer-events-none
                "
              />


              <div
                className="
                  relative
                  z-10
                "
              >

                {/* Check */}

                <div
                  className="
                    mx-auto
                    mb-4
                    sm:mb-5
                    flex
                    items-center
                    justify-center
                    w-14
                    h-14
                    sm:w-16
                    sm:h-16
                    rounded-2xl
                    bg-emerald-50
                    border
                    border-emerald-200
                    text-emerald-600
                    shadow-sm
                  "
                >

                  <CheckCircle2
                    className="
                      w-7
                      h-7
                      sm:w-8
                      sm:h-8
                    "
                  />

                </div>


                {/* 정답 표시 */}

                <div
                  className="
                    text-sm
                    sm:text-base
                    font-black
                    text-emerald-600
                    mb-2
                  "
                >
                  정답입니다!
                </div>


                {/* 정답 제목 */}

                <h3
                  className="
                    font-black
                    text-slate-900
                    tracking-tight
                    mb-3
                    sm:mb-4
                  "
                  style={{
                    fontSize:
                      'clamp(24px, 2.3vw, 38px)',
                  }}
                >
                  {activeExplanation.title}
                </h3>


                {/* 설명 */}

                <p
                  className="
                    max-w-2xl
                    mx-auto
                    text-slate-600
                    font-medium
                    leading-relaxed
                  "
                  style={{
                    fontSize:
                      'clamp(15px, 1.25vw, 20px)',
                  }}
                >
                  {activeExplanation.text}
                </p>


                {/* 안내 */}

                <div
                  className="
                    mt-5
                    sm:mt-6
                    inline-flex
                    items-center
                    px-4
                    py-2
                    rounded-full
                    bg-emerald-50
                    border
                    border-emerald-100
                    text-xs
                    sm:text-sm
                    font-bold
                    text-emerald-700
                  "
                >
                  계속해서 다른 보안 위험도 찾아보세요!
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};