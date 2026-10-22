import React from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  ShieldCheck,
  Clock3,
  CircleDot,
  Lightbulb,
  Play,
  AlertCircle,
  Settings,
  Search,
  Sparkles,
  MousePointer2,
  ListChecks,
  CheckCircle2,
} from 'lucide-react';

import {
  DEFAULT_CONFIG,
} from '../constants/config';


interface StartScreenProps {

  gameTitle?: string;

  /*
   * 이제 의미는
   * "이번 게임에서 풀 문제 수"
   *
   * 현재 GamePage에서는 3 전달
   */
  totalRisksCount: number;

  timeLimit: number;

  lives: number;

  hintCount: number;

  onStart: () => void;

  isLoadingImages: boolean;

  imageLoadError: boolean;

  onRetryImageLoad: () => void;
}


export const StartScreen:
React.FC<StartScreenProps> = ({

  gameTitle =
    DEFAULT_CONFIG.gameTitle,

  totalRisksCount,

  timeLimit,

  lives,

  hintCount,

  onStart,

  isLoadingImages,

  imageLoadError,

  onRetryImageLoad,

}) => {

  return (

    <div
      className="
        w-full
        max-w-6xl
        mx-auto
        my-auto
        p-4
        sm:p-6
        lg:p-8
        animate-fade-in
        relative
      "
    >

      {/* =====================================================
          관리자
      ===================================================== */}

      <div
        className="
          absolute
          top-6
          right-6
          sm:top-8
          sm:right-8
          z-20
        "
      >

        <Link
          to="/admin"
          title="관리자 설정으로 이동"
          className="
            flex
            items-center
            gap-1.5
            px-3
            py-1.5
            rounded-xl
            text-xs
            font-semibold
            text-slate-500
            hover:text-blue-700
            bg-white/90
            hover:bg-blue-50
            border
            border-slate-200
            hover:border-blue-200
            transition-colors
            shadow-sm
            backdrop-blur-sm
          "
        >

          <Settings
            className="
              w-3.5
              h-3.5
            "
          />

          <span>
            관리자
          </span>

        </Link>

      </div>


      {/* =====================================================
          Main Card
      ===================================================== */}

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

        {/* ===================================================
            상단 캠페인 영역
        =================================================== */}

        <div
          className="
            relative
            overflow-hidden
            px-6
            py-9
            sm:px-10
            sm:py-11
            lg:px-14
            lg:py-12
            text-center
            bg-gradient-to-br
            from-sky-50
            via-white
            to-cyan-50
            border-b
            border-sky-100
          "
        >

          {/* 장식 */}

          <div
            className="
              absolute
              -top-16
              -left-16
              w-56
              h-56
              rounded-full
              bg-blue-100/50
              blur-3xl
              pointer-events-none
            "
          />


          <div
            className="
              absolute
              -bottom-20
              -right-10
              w-64
              h-64
              rounded-full
              bg-cyan-100/60
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

            {/* 캠페인 뱃지 */}

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                bg-white
                border
                border-blue-100
                text-blue-700
                text-xs
                sm:text-sm
                font-bold
                shadow-sm
                mb-5
              "
            >

              <ShieldCheck
                className="
                  w-4
                  h-4
                  text-blue-600
                "
              />

              <span>
                병원 정보보호 실천 캠페인
              </span>

            </div>


            {/* 제목 */}

            <div
              className="
                flex
                items-center
                justify-center
                gap-2
                sm:gap-3
                mb-4
              "
            >

              <Search
                className="
                  hidden
                  sm:block
                  w-8
                  h-8
                  text-blue-500
                "
              />


              <h1
                className="
                  font-black
                  tracking-tight
                  text-slate-900
                  text-balance
                "
                style={{
                  fontSize:
                    'clamp(30px, 3.3vw, 58px)',
                }}
              >
                {gameTitle}
              </h1>

            </div>


            {/* 설명 */}

            <p
              className="
                text-slate-600
                max-w-3xl
                mx-auto
                font-medium
                leading-relaxed
                text-balance
              "
              style={{
                fontSize:
                  'clamp(15px, 1.25vw, 20px)',
              }}
            >
              사진 속 보안 취약점을 찾아 클릭하고,
              어떤 정보보호 위험인지까지 맞혀보세요.
            </p>


            {/* 문제 수 */}

            <div
              className="
                mt-5
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
              style={{
                fontSize:
                  'clamp(14px, 1.1vw, 18px)',
              }}
            >

              <Sparkles
                className="
                  w-4
                  h-4
                  sm:w-5
                  sm:h-5
                "
              />


              <span>
                랜덤으로 출제되는
                {' '}
                {totalRisksCount}개의
                {' '}
                보안 취약점에 도전하세요
              </span>

            </div>

          </div>

        </div>


        {/* ===================================================
            게임 정보
        =================================================== */}

        <div
          className="
            px-5
            py-6
            sm:px-8
            sm:py-8
            lg:px-10
            lg:py-9
          "
        >

          {/* =================================================
              기본 규칙 카드
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-3
              sm:gap-4
            "
          >

            {/* 제한시간 */}

            <div
              className="
                p-4
                sm:p-5
                rounded-2xl
                bg-blue-50/70
                border
                border-blue-100
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white
                  border
                  border-blue-100
                  flex
                  items-center
                  justify-center
                  text-blue-600
                  shadow-sm
                  shrink-0
                "
              >

                <Clock3
                  className="
                    w-6
                    h-6
                  "
                />

              </div>


              <div>

                <div
                  className="
                    text-xs
                    text-slate-500
                    font-semibold
                    mb-0.5
                  "
                >
                  전체 제한시간
                </div>


                <div
                  className="
                    text-lg
                    sm:text-xl
                    font-black
                    text-slate-900
                  "
                >
                  {timeLimit}초
                </div>

              </div>

            </div>


            {/* 기회 */}

            <div
              className="
                p-4
                sm:p-5
                rounded-2xl
                bg-rose-50/70
                border
                border-rose-100
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white
                  border
                  border-rose-100
                  flex
                  items-center
                  justify-center
                  text-rose-500
                  shadow-sm
                  shrink-0
                "
              >

                <CircleDot
                  className="
                    w-6
                    h-6
                  "
                />

              </div>


              <div>

                <div
                  className="
                    text-xs
                    text-slate-500
                    font-semibold
                    mb-0.5
                  "
                >
                  기회
                </div>


                <div
                  className="
                    text-lg
                    sm:text-xl
                    font-black
                    text-slate-900
                  "
                >
                  {lives}회
                </div>

              </div>

            </div>


            {/* 힌트 */}

            <div
              className="
                p-4
                sm:p-5
                rounded-2xl
                bg-amber-50/70
                border
                border-amber-100
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white
                  border
                  border-amber-100
                  flex
                  items-center
                  justify-center
                  text-amber-500
                  shadow-sm
                  shrink-0
                "
              >

                <Lightbulb
                  className="
                    w-6
                    h-6
                  "
                />

              </div>


              <div>

                <div
                  className="
                    text-xs
                    text-slate-500
                    font-semibold
                    mb-0.5
                  "
                >
                  힌트
                </div>


                <div
                  className="
                    text-lg
                    sm:text-xl
                    font-black
                    text-slate-900
                  "
                >
                  {hintCount}회
                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              게임 방법
          ================================================= */}

          <div
            className="
              mt-5
              sm:mt-6
              p-4
              sm:p-5
              rounded-2xl
              bg-slate-50
              border
              border-slate-200
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >

              <ListChecks
                className="
                  w-5
                  h-5
                  text-blue-600
                "
              />


              <h2
                className="
                  text-sm
                  sm:text-base
                  font-black
                  text-slate-900
                "
              >
                게임 방법
              </h2>

            </div>


            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-3
              "
            >

              {/* STEP 1 */}

              <div
                className="
                  relative
                  bg-white
                  border
                  border-slate-200
                  rounded-2xl
                  p-4
                "
              >

                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-7
                    h-7
                    rounded-full
                    bg-blue-600
                    text-white
                    text-xs
                    font-black
                    mb-3
                  "
                >
                  1
                </div>


                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-1.5
                  "
                >

                  <MousePointer2
                    className="
                      w-4
                      h-4
                      text-blue-600
                    "
                  />


                  <div
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                    "
                  >
                    취약 위치 찾기
                  </div>

                </div>


                <p
                  className="
                    text-xs
                    text-slate-500
                    leading-relaxed
                  "
                >
                  사진을 보고 보안상 문제가 있다고 생각되는 부분을 클릭하세요.
                </p>

              </div>


              {/* STEP 2 */}

              <div
                className="
                  relative
                  bg-white
                  border
                  border-slate-200
                  rounded-2xl
                  p-4
                "
              >

                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-7
                    h-7
                    rounded-full
                    bg-blue-600
                    text-white
                    text-xs
                    font-black
                    mb-3
                  "
                >
                  2
                </div>


                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-1.5
                  "
                >

                  <ListChecks
                    className="
                      w-4
                      h-4
                      text-blue-600
                    "
                  />


                  <div
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                    "
                  >
                    취약점 종류 맞히기
                  </div>

                </div>


                <p
                  className="
                    text-xs
                    text-slate-500
                    leading-relaxed
                  "
                >
                  위치가 맞으면 4개의 보기 중 해당 보안 취약점 종류를 선택하세요.
                </p>

              </div>


              {/* STEP 3 */}

              <div
                className="
                  relative
                  bg-white
                  border
                  border-slate-200
                  rounded-2xl
                  p-4
                "
              >

                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-7
                    h-7
                    rounded-full
                    bg-emerald-600
                    text-white
                    text-xs
                    font-black
                    mb-3
                  "
                >
                  3
                </div>


                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-1.5
                  "
                >

                  <CheckCircle2
                    className="
                      w-4
                      h-4
                      text-emerald-600
                    "
                  />


                  <div
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                    "
                  >
                    3문제 모두 완료
                  </div>

                </div>


                <p
                  className="
                    text-xs
                    text-slate-500
                    leading-relaxed
                  "
                >
                  제한시간 안에 위치와 취약점 종류를 모두 맞히면 성공입니다.
                </p>

              </div>

            </div>


            <div
              className="
                mt-4
                px-3.5
                py-2.5
                rounded-xl
                bg-rose-50
                border
                border-rose-100
                text-xs
                text-rose-700
                font-semibold
                text-center
              "
            >
              잘못된 위치를 클릭하거나 4지선다를 틀리면 기회가 1회 차감됩니다.
            </div>

          </div>


          {/* =================================================
              Start / Error
          ================================================= */}

          <div
            className="
              mt-6
              sm:mt-7
            "
          >

            {imageLoadError ? (

              <div
                className="
                  max-w-xl
                  mx-auto
                  p-5
                  rounded-2xl
                  bg-rose-50
                  border
                  border-rose-200
                  text-center
                  space-y-3
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-rose-700
                    font-bold
                    text-sm
                  "
                >

                  <AlertCircle
                    className="
                      w-5
                      h-5
                    "
                  />

                  <span>
                    게임 이미지를 불러올 수 없습니다.
                  </span>

                </div>


                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-rose-600
                  "
                >
                  네트워크 연결을 확인한 후 다시 시도해주세요.
                </p>


                <button
                  type="button"
                  onClick={
                    onRetryImageLoad
                  }
                  className="
                    px-5
                    py-2.5
                    bg-rose-600
                    text-white
                    font-bold
                    rounded-xl
                    hover:bg-rose-700
                    transition-colors
                    cursor-pointer
                    text-sm
                  "
                >
                  다시 불러오기
                </button>

              </div>

            ) : (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={
                    onStart
                  }
                  disabled={
                    isLoadingImages
                  }
                  className={`
                    w-full
                    max-w-md
                    py-4
                    px-8
                    rounded-2xl
                    font-black
                    text-white
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-3
                    ${
                      isLoadingImages
                        ? `
                          bg-slate-300
                          text-slate-500
                          cursor-wait
                          shadow-none
                        `
                        : `
                          bg-blue-600
                          hover:bg-blue-700
                          active:bg-blue-800
                          shadow-lg
                          shadow-blue-200
                          hover:-translate-y-0.5
                          cursor-pointer
                        `
                    }
                  `}
                  style={{
                    fontSize:
                      'clamp(17px, 1.3vw, 22px)',
                  }}
                >

                  {isLoadingImages ? (

                    <>
                      <div
                        className="
                          w-5
                          h-5
                          border-2
                          border-slate-400/40
                          border-t-slate-600
                          rounded-full
                          animate-spin
                        "
                      />

                      <span>
                        문제 3장 준비 중...
                      </span>
                    </>

                  ) : (

                    <>
                      <Play
                        className="
                          w-5
                          h-5
                          fill-white
                        "
                      />

                      <span>
                        게임 시작하기
                      </span>
                    </>
                  )}

                </button>


                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-slate-500
                    text-center
                    font-medium
                  "
                >
                  {DEFAULT_CONFIG.campaignSlogan}
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};