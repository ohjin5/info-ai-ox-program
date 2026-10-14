import React from 'react';

import {
  Lightbulb,
  X,
  Search,
} from 'lucide-react';


interface HintModalProps {
  isOpen: boolean;

  onClose: () => void;

  hintText: string;
}


export const HintModal:
React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  hintText,
}) => {

  if (!isOpen) {
    return null;
  }


  return (

    <div
      role="dialog"
      aria-modal="true"
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        p-4
        bg-slate-900/25
        backdrop-blur-sm
        animate-fade-in
      "
      onClick={
        onClose
      }
    >

      <div
        className="
          w-full
          max-w-md
          bg-white
          rounded-3xl
          shadow-2xl
          shadow-slate-200/70
          border
          border-amber-100
          overflow-hidden
          transform
          transition-all
          animate-scale-in
        "
        onClick={
          e =>
            e.stopPropagation()
        }
      >

        {/* ===================================================
            Header
        =================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            px-6
            py-5
            bg-gradient-to-r
            from-amber-50
            via-white
            to-sky-50
            border-b
            border-amber-100
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-2xl
                bg-white
                border
                border-amber-200
                text-amber-500
                flex
                items-center
                justify-center
                shadow-sm
              "
            >

              <Lightbulb
                className="
                  w-5
                  h-5
                "
              />

            </div>


            <div>

              <h3
                className="
                  text-base
                  sm:text-lg
                  font-black
                  text-slate-900
                "
              >
                힌트 확인
              </h3>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                사진 속 보안 위험을 찾는 데 도움이 되는 단서입니다.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              p-2
              rounded-xl
              text-slate-400
              hover:text-slate-700
              hover:bg-white
              transition-colors
            "
            aria-label="닫기"
          >

            <X
              className="
                w-5
                h-5
              "
            />

          </button>

        </div>


        {/* ===================================================
            Hint Content
        =================================================== */}

        <div
          className="
            p-6
            sm:p-7
          "
        >

          <div
            className="
              flex
              flex-col
              items-center
              text-center
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-blue-50
                border
                border-blue-100
                text-blue-600
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Search
                className="
                  w-5
                  h-5
                "
              />

            </div>


            <div
              className="
                w-full
                py-5
                px-5
                rounded-2xl
                bg-amber-50/70
                border
                border-amber-100
                text-slate-800
                font-bold
                leading-relaxed
              "
              style={{
                fontSize:
                  'clamp(15px, 1.2vw, 19px)',
              }}
            >
              “{hintText}”
            </div>


            <p
              className="
                mt-4
                text-xs
                sm:text-sm
                text-slate-500
                leading-relaxed
              "
            >
              사진을 천천히 살펴보고,
              평소 업무 중 놓치기 쉬운
              정보보호 위험을 찾아보세요.
            </p>

          </div>

        </div>


        {/* ===================================================
            Footer
        =================================================== */}

        <div
          className="
            px-6
            py-4
            bg-slate-50/80
            border-t
            border-slate-100
            flex
            justify-center
          "
        >

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              w-full
              max-w-xs
              px-5
              py-3
              bg-blue-600
              hover:bg-blue-700
              active:bg-blue-800
              text-white
              font-bold
              text-sm
              rounded-xl
              shadow-md
              shadow-blue-100
              transition-all
              cursor-pointer
            "
          >
            확인하고 계속 찾기
          </button>

        </div>

      </div>

    </div>
  );
};