import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  Crosshair,
  AlertCircle,
  MapPin,
  RotateCcw,
  Trash2,
  MousePointer2,
  CheckCircle2,
} from 'lucide-react';

import type {
  SecurityAnswer,
} from '../services/apiService';

import {
  getRenderedImageBounds,
  clientPointToImagePercent,
  type RenderedImageBounds,
} from '../utils/imageCoordinates';


interface ImageAnswerEditorProps {

  riskImageSrc:
    string;

  /*
   * 한 문제 안에서
   * 정답으로 인정할 여러 위치
   */
  answers:
    SecurityAnswer[];

  onChangeAnswers: (
    answers:
      SecurityAnswer[]
  ) => void;
}


/* =========================================================
   기본 판정 반경
========================================================= */

const DEFAULT_RADIUS =
  8;


/* =========================================================
   ImageAnswerEditor
========================================================= */

export const ImageAnswerEditor:
React.FC<ImageAnswerEditorProps> = ({

  riskImageSrc,

  answers,

  onChangeAnswers,

}) => {

  const imgRef =
    useRef<HTMLImageElement>(
      null
    );


  /* =========================================================
     실제 이미지 Bounds
  ========================================================= */

  const [
    bounds,
    setBounds,
  ] =
    useState<
      RenderedImageBounds |
      null
    >(
      null
    );


  /* =========================================================
     Hover 좌표
  ========================================================= */

  const [
    hoverCoords,
    setHoverCoords,
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
     현재 선택한 정답 위치

     반경 조정 / 삭제 대상으로 사용
  ========================================================= */

  const [
    selectedAnswerId,
    setSelectedAnswerId,
  ] =
    useState<number | null>(
      null
    );


  /* =========================================================
     현재 선택된 Answer
  ========================================================= */

  const selectedAnswer =
    selectedAnswerId !==
      null
      ? (
          answers.find(
            answer =>
              answer.id ===
              selectedAnswerId
          ) ||
          null
        )
      : null;


  /* =========================================================
     answers 변경 시 선택 상태 보정
  ========================================================= */

  useEffect(
    () => {

      if (
        answers.length ===
        0
      ) {

        setSelectedAnswerId(
          null
        );


        return;
      }


      /*
       * 선택 중인 위치가 아직 존재하면 유지
       */
      if (
        selectedAnswerId !==
          null &&

        answers.some(
          answer =>
            answer.id ===
            selectedAnswerId
        )
      ) {

        return;
      }


      /*
       * 없으면 마지막 위치 선택
       */
      setSelectedAnswerId(
        answers[
          answers.length -
          1
        ].id
      );

    },
    [
      answers,
      selectedAnswerId,
    ]
  );


  /* =========================================================
     Bounds 계산
  ========================================================= */

  const updateBounds =
    useCallback(
      () => {

        if (
          imgRef.current
        ) {

          const nextBounds =
            getRenderedImageBounds(
              imgRef.current
            );


          setBounds(
            nextBounds
          );
        }
      },
      []
    );


  useEffect(
    () => {

      updateBounds();


      window.addEventListener(
        'resize',
        updateBounds
      );


      return () => {

        window.removeEventListener(
          'resize',
          updateBounds
        );
      };

    },
    [
      updateBounds,
    ]
  );


  /* =========================================================
     Mouse Hover
  ========================================================= */

  const handleMouseMove =
    (
      e:
        React.MouseEvent<HTMLDivElement>
    ) => {

      if (
        !imgRef.current
      ) {

        return;
      }


      const point =
        clientPointToImagePercent(
          e.clientX,
          e.clientY,
          imgRef.current
        );


      setHoverCoords(
        point
      );
    };


  const handleMouseLeave =
    () => {

      setHoverCoords(
        null
      );
    };


  /* =========================================================
     새 정답 위치 추가
  ========================================================= */

  const handleImageClick =
    (
      e:
        React.MouseEvent<HTMLDivElement>
    ) => {

      if (
        !imgRef.current
      ) {

        return;
      }


      const point =
        clientPointToImagePercent(
          e.clientX,
          e.clientY,
          imgRef.current
        );


      /*
       * object-fit: contain 바깥 여백은 무시
       */
      if (
        !point
      ) {

        return;
      }


      /* -------------------------------------------------------
         새 ID

         기존 위치 최대 id + 1
      ------------------------------------------------------- */

      const nextId =
        answers.length >
          0
          ? Math.max(
              ...answers.map(
                answer =>
                  Number(
                    answer.id
                  ) ||
                  0
              )
            ) +
            1
          : 1;


      /*
       * 취약점 메타데이터는
       * 기존 첫 번째 위치에서 이어받음
       *
       * QuestionEditor가 저장할 때
       * 최종 vulnerabilityId / title / explanation을
       * 다시 동일하게 맞춰줍니다.
       */
      const baseAnswer =
        answers[0];


      const nextAnswer:
        SecurityAnswer = {

          id:
            nextId,


          x:
            point.x,


          y:
            point.y,


          radius:
            selectedAnswer
              ?.radius ||
            baseAnswer
              ?.radius ||
            DEFAULT_RADIUS,


          vulnerabilityId:
            baseAnswer
              ?.vulnerabilityId,


          title:
            baseAnswer
              ?.title ||
            '보안 취약점',


          hint:
            baseAnswer
              ?.hint ||
            '',


          explanation:
            baseAnswer
              ?.explanation ||
            '',
        };


      const nextAnswers = [
        ...answers,
        nextAnswer,
      ];


      onChangeAnswers(
        nextAnswers
      );


      setSelectedAnswerId(
        nextId
      );
    };


  /* =========================================================
     특정 위치 선택
  ========================================================= */

  const handleSelectAnswer =
    (
      answerId:
        number
    ) => {

      setSelectedAnswerId(
        answerId
      );
    };


  /* =========================================================
     특정 위치 판정 반경 변경
  ========================================================= */

  const handleRadiusChange =
    (
      radius:
        number
    ) => {

      if (
        !selectedAnswer
      ) {

        return;
      }


      const nextAnswers =
        answers.map(
          answer =>
            answer.id ===
              selectedAnswer.id
              ? {
                  ...answer,

                  radius,
                }
              : answer
        );


      onChangeAnswers(
        nextAnswers
      );
    };


  /* =========================================================
     특정 위치 삭제
  ========================================================= */

  const handleDeleteAnswer =
    (
      answerId:
        number
    ) => {

      const nextAnswers =
        answers.filter(
          answer =>
            answer.id !==
            answerId
        );


      onChangeAnswers(
        nextAnswers
      );


      if (
        selectedAnswerId ===
        answerId
      ) {

        const remaining =
          nextAnswers[
            nextAnswers.length -
            1
          ];


        setSelectedAnswerId(
          remaining
            ?.id ||
          null
        );
      }
    };


  /* =========================================================
     모든 위치 초기화
  ========================================================= */

  const handleReset =
    () => {

      onChangeAnswers(
        []
      );


      setSelectedAnswerId(
        null
      );
    };


  /* =========================================================
     Render
  ========================================================= */

  return (

    <div
      className="
        space-y-4
      "
    >

      {/* =====================================================
          안내
      ===================================================== */}

      <div
        className="
          p-3.5
          sm:p-4
          rounded-xl
          bg-blue-50
          border
          border-blue-200
          flex
          flex-col
          sm:flex-row
          sm:items-center
          justify-between
          gap-3
        "
      >

        <div
          className="
            flex
            items-start
            sm:items-center
            gap-2
          "
        >

          <Crosshair
            className="
              w-4
              h-4
              text-blue-600
              shrink-0
              mt-0.5
              sm:mt-0
            "
          />


          <span
            className="
              text-xs
              sm:text-sm
              text-blue-900
              font-medium
            "
          >
            {
              answers.length >
                0
                ? (
                    <>
                      정답으로 인정할 위치가
                      {' '}
                      <strong>
                        {answers.length}개
                      </strong>
                      {' '}
                      등록되어 있습니다.
                      다른 정답 위치가 있다면 사진을 추가로 클릭하세요.
                    </>
                  )
                : (
                    '사진에서 정답으로 인정할 위치를 클릭하세요. 같은 취약점이 여러 곳이면 여러 곳을 등록할 수 있습니다.'
                  )
            }
          </span>

        </div>


        <div
          className="
            font-mono
            text-[11px]
            sm:text-xs
            text-slate-600
            font-bold
            shrink-0
          "
        >

          {
            hoverCoords
              ? (
                  <>
                    X {hoverCoords.x.toFixed(1)}%
                    {' · '}
                    Y {hoverCoords.y.toFixed(1)}%
                  </>
                )
              : (
                  '사진 위에 마우스를 올려보세요'
                )
          }

        </div>

      </div>


      {/* =====================================================
          Editor Layout
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[minmax(0,1fr)_320px]
          gap-5
          items-start
        "
      >

        {/* ===================================================
            Image Canvas
        =================================================== */}

        <div
          className="
            space-y-2
          "
        >

          <div
            className="
              relative
              w-full
              aspect-[16/9]
              max-h-[650px]
              bg-slate-50
              rounded-2xl
              overflow-hidden
              border-2
              border-slate-200
              hover:border-blue-400
              shadow-inner
              select-none
              cursor-crosshair
              transition-colors
            "
            onClick={
              handleImageClick
            }
            onMouseMove={
              handleMouseMove
            }
            onMouseLeave={
              handleMouseLeave
            }
          >

            <img
              ref={
                imgRef
              }
              src={
                riskImageSrc
              }
              alt="보안 취약점 정답 위치 지정"
              className="
                w-full
                h-full
                object-contain
                pointer-events-none
                select-none
              "
              onLoad={
                updateBounds
              }
              draggable={
                false
              }
            />


            {/* ===============================================
                실제 렌더링 이미지 영역
            =============================================== */}

            {bounds && (

              <div
                className="
                  absolute
                  pointer-events-none
                "
                style={{

                  left:
                    `${bounds.offsetX}px`,

                  top:
                    `${bounds.offsetY}px`,

                  width:
                    `${bounds.renderedWidth}px`,

                  height:
                    `${bounds.renderedHeight}px`,
                }}
              >

                {/* ===========================================
                    모든 정답 인정 위치 표시
                =========================================== */}

                {answers.map(
                  (
                    answer,
                    index
                  ) => {

                    const isSelected =
                      answer.id ===
                      selectedAnswerId;


                    return (

                      <div
                        key={
                          answer.id
                        }
                        className="
                          absolute
                          -translate-x-1/2
                          -translate-y-1/2
                          flex
                          items-center
                          justify-center
                          pointer-events-auto
                        "
                        style={{

                          left:
                            `${answer.x}%`,

                          top:
                            `${answer.y}%`,

                          width:
                            `${answer.radius * 2}%`,

                          height:
                            `${
                              answer.radius *
                              2 *
                              (
                                bounds.renderedWidth /
                                bounds.renderedHeight
                              )
                            }%`,
                        }}
                        onClick={
                          event => {

                            /*
                             * 위치 마커 클릭 시
                             * 새 정답 위치가 추가되지 않도록 차단
                             */
                            event
                              .stopPropagation();


                            handleSelectAnswer(
                              answer.id
                            );
                          }
                        }
                      >

                        <div
                          className={`
                            w-full
                            h-full
                            rounded-full
                            border-2
                            ring-2
                            shadow-lg
                            flex
                            items-center
                            justify-center
                            transition-all
                            cursor-pointer
                            ${
                              isSelected
                                ? `
                                  bg-blue-500/30
                                  border-blue-600
                                  ring-blue-300/50
                                  scale-105
                                `
                                : `
                                  bg-cyan-400/20
                                  border-cyan-500
                                  ring-cyan-200/40
                                `
                            }
                          `}
                        >

                          <div
                            className={`
                              w-8
                              h-8
                              sm:w-9
                              sm:h-9
                              rounded-full
                              text-white
                              flex
                              items-center
                              justify-center
                              shadow-md
                              font-black
                              text-xs
                              ${
                                isSelected
                                  ? 'bg-blue-600'
                                  : 'bg-cyan-600'
                              }
                            `}
                          >

                            {
                              index +
                              1
                            }

                          </div>

                        </div>


                        {/* 좌표 */}

                        <div
                          className={`
                            absolute
                            left-1/2
                            -bottom-7
                            -translate-x-1/2
                            whitespace-nowrap
                            px-2
                            py-1
                            rounded-lg
                            bg-white/95
                            font-mono
                            text-[10px]
                            font-bold
                            shadow
                            border
                            ${
                              isSelected
                                ? `
                                  text-blue-700
                                  border-blue-200
                                `
                                : `
                                  text-cyan-700
                                  border-cyan-100
                                `
                            }
                          `}
                        >
                          위치 {index + 1}
                        </div>

                      </div>

                    );
                  }
                )}

              </div>
            )}

          </div>


          <p
            className="
              px-1
              text-[11px]
              text-slate-400
            "
          >
            사진을 클릭할 때마다 정답 인정 위치가 추가됩니다.
            이미 등록한 원을 클릭하면 해당 위치를 선택하여 반경을 조정할 수 있습니다.
          </p>

        </div>


        {/* ===================================================
            오른쪽 설정
        =================================================== */}

        <div
          className="
            bg-slate-50
            border
            border-slate-200
            rounded-2xl
            p-4
            sm:p-5
            space-y-5
          "
        >

          {/* =================================================
              Header
          ================================================= */}

          <div>

            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >

              <h4
                className="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                정답 인정 위치
              </h4>


              <span
                className="
                  px-2.5
                  py-1
                  rounded-full
                  bg-blue-100
                  text-blue-700
                  text-[11px]
                  font-black
                "
              >
                {answers.length}개
              </span>

            </div>


            <p
              className="
                text-xs
                text-slate-500
                mt-1
                leading-relaxed
              "
            >
              같은 보안 취약점이 여러 곳에 있으면 모든 위치를 등록하세요.
              게임에서는 등록된 위치 중 하나만 클릭해도 정답 처리됩니다.
            </p>

          </div>


          {/* =================================================
              등록 위치 목록
          ================================================= */}

          {answers.length >
            0 ? (

            <div
              className="
                space-y-2
              "
            >

              {answers.map(
                (
                  answer,
                  index
                ) => {

                  const isSelected =
                    selectedAnswerId ===
                    answer.id;


                  return (

                    <button
                      key={
                        answer.id
                      }
                      type="button"
                      onClick={() =>
                        handleSelectAnswer(
                          answer.id
                        )
                      }
                      className={`
                        w-full
                        text-left
                        p-3
                        rounded-xl
                        border
                        transition-all
                        ${
                          isSelected
                            ? `
                              bg-blue-50
                              border-blue-300
                              ring-1
                              ring-blue-200
                            `
                            : `
                              bg-white
                              border-slate-200
                              hover:border-blue-200
                            `
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-center
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
                            className={`
                              w-7
                              h-7
                              rounded-full
                              flex
                              items-center
                              justify-center
                              text-xs
                              font-black
                              ${
                                isSelected
                                  ? `
                                    bg-blue-600
                                    text-white
                                  `
                                  : `
                                    bg-slate-100
                                    text-slate-600
                                  `
                              }
                            `}
                          >
                            {index + 1}
                          </div>


                          <div>

                            <div
                              className="
                                text-xs
                                font-bold
                                text-slate-800
                              "
                            >
                              정답 위치 {index + 1}
                            </div>


                            <div
                              className="
                                font-mono
                                text-[10px]
                                text-slate-500
                                mt-0.5
                              "
                            >
                              X {answer.x.toFixed(1)}%
                              {' · '}
                              Y {answer.y.toFixed(1)}%
                            </div>

                          </div>

                        </div>


                        {isSelected && (

                          <CheckCircle2
                            className="
                              w-4
                              h-4
                              text-blue-600
                              shrink-0
                            "
                          />

                        )}

                      </div>

                    </button>

                  );
                }
              )}

            </div>

          ) : (

            <div
              className="
                p-4
                rounded-xl
                bg-amber-50
                border
                border-amber-200
                flex
                items-start
                gap-2
              "
            >

              <AlertCircle
                className="
                  w-4
                  h-4
                  text-amber-600
                  shrink-0
                  mt-0.5
                "
              />


              <div>

                <div
                  className="
                    text-xs
                    font-bold
                    text-amber-800
                  "
                >
                  정답 위치가 없습니다.
                </div>


                <p
                  className="
                    text-[11px]
                    text-amber-700
                    mt-1
                    leading-relaxed
                  "
                >
                  사진에서 정답으로 인정할 보안 취약점 위치를 클릭해주세요.
                </p>

              </div>

            </div>
          )}


          {/* =================================================
              현재 선택 위치
          ================================================= */}

          {selectedAnswer && (

            <div
              className="
                p-3.5
                rounded-xl
                bg-emerald-50
                border
                border-emerald-200
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-bold
                  text-emerald-800
                  mb-2
                "
              >

                <MapPin
                  className="
                    w-4
                    h-4
                  "
                />

                <span>
                  현재 선택된 위치
                </span>

              </div>


              <div
                className="
                  font-mono
                  text-xs
                  text-emerald-700
                "
              >
                X:
                {' '}
                {selectedAnswer.x.toFixed(2)}%
                <br />

                Y:
                {' '}
                {selectedAnswer.y.toFixed(2)}%
              </div>

            </div>

          )}


          {/* =================================================
              Radius
          ================================================= */}

          <div>

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-2
              "
            >

              <label
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                선택 위치 클릭 판정 범위
              </label>


              <span
                className="
                  px-2
                  py-0.5
                  rounded-md
                  bg-white
                  border
                  border-slate-200
                  font-mono
                  text-xs
                  font-bold
                  text-blue-700
                "
              >
                {selectedAnswer?.radius ?? DEFAULT_RADIUS}%
              </span>

            </div>


            <input
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={
                selectedAnswer
                  ?.radius ??
                DEFAULT_RADIUS
              }
              disabled={
                !selectedAnswer
              }
              onChange={
                e =>
                  handleRadiusChange(
                    Number(
                      e.target.value
                    )
                  )
              }
              className="
                w-full
                accent-blue-600
                disabled:opacity-40
                cursor-pointer
                disabled:cursor-not-allowed
              "
            />


            <div
              className="
                mt-1.5
                flex
                items-center
                justify-between
                text-[10px]
                text-slate-400
              "
            >

              <span>
                정밀
              </span>

              <span>
                넓게
              </span>

            </div>


            <p
              className="
                text-[11px]
                text-slate-500
                leading-relaxed
                mt-2
              "
            >
              위치별로 각각 판정 범위를 설정할 수 있습니다.
              일반적인 사진에서는 6~9% 정도가 적당합니다.
            </p>

          </div>


          {/* =================================================
              Selected Delete
          ================================================= */}

          {selectedAnswer && (

            <button
              type="button"
              onClick={() =>
                handleDeleteAnswer(
                  selectedAnswer.id
                )
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-xl
                bg-white
                border
                border-slate-200
                text-slate-600
                hover:text-rose-600
                hover:border-rose-200
                hover:bg-rose-50
                transition-colors
                text-xs
                font-semibold
                flex
                items-center
                justify-center
                gap-1.5
              "
            >

              <Trash2
                className="
                  w-3.5
                  h-3.5
                "
              />

              선택한 위치 삭제

            </button>
          )}


          {/* =================================================
              Reset All
          ================================================= */}

          {answers.length >
            0 && (

            <button
              type="button"
              onClick={
                handleReset
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-xl
                bg-white
                border
                border-slate-200
                text-slate-600
                hover:text-rose-600
                hover:border-rose-200
                hover:bg-rose-50
                transition-colors
                text-xs
                font-semibold
                flex
                items-center
                justify-center
                gap-1.5
              "
            >

              <RotateCcw
                className="
                  w-3.5
                  h-3.5
                "
              />

              모든 정답 위치 다시 지정

            </button>
          )}


          {/* =================================================
              사용 방법
          ================================================= */}

          <div
            className="
              p-3
              rounded-xl
              bg-blue-50
              border
              border-blue-100
            "
          >

            <div
              className="
                flex
                items-start
                gap-2
              "
            >

              <MousePointer2
                className="
                  w-4
                  h-4
                  text-blue-600
                  shrink-0
                  mt-0.5
                "
              />


              <p
                className="
                  text-[11px]
                  sm:text-xs
                  text-blue-800
                  leading-relaxed
                "
              >
                예를 들어 사진에 EMR 화면이 두 군데 노출되어 있다면
                두 모니터를 각각 클릭해 위치 1, 위치 2로 등록하세요.
                참가자는 둘 중 어느 위치를 클릭해도 위치 정답으로 인정됩니다.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};