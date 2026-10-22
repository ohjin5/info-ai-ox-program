/**
 * Google Apps Script API Service
 *
 * Google Sheets + Google Drive 기반
 * 정보보호 보안취약점 찾기 게임 API
 *
 * =========================================================
 * 신규 게임 구조
 * =========================================================
 *
 * 1개 문제 =
 *
 * - 보안취약점 이미지 1장
 * - 정답 위치 1개
 * - 취약점 유형 1개
 *
 * 게임에서는 활성 문제 중 랜덤 3개를 선택하고,
 *
 * 1) 이미지에서 취약 위치 클릭
 * 2) 4지선다에서 취약점 유형 선택
 *
 * 두 단계 모두 맞혀야 해당 문제를 완료한 것으로 처리합니다.
 *
 * =========================================================
 * 이미지 구조
 * =========================================================
 *
 * Google Drive 파일은 비공개
 *
 * Sheet에는 Drive fileId 저장
 *
 * Apps Script:
 *
 * GET
 * ?action=image&fileId=xxxxx
 *
 * 로 Base64를 읽고
 *
 * browser:
 *
 * data:image/jpeg;base64,...
 *
 * 형식으로 변환하여 사용합니다.
 */


import {
  API_URL,
  DEFAULT_CONFIG,
} from '../constants/config';


import type {
  SecurityVulnerabilityId,
} from '../constants/securityVulnerabilities';


/* =========================================================
   Security Answer
========================================================= */

/**
 * 사진 속 실제 정답 위치
 *
 * 신규 구조에서는
 * 한 Question 당 정답 1개 사용을 기본으로 합니다.
 */
export interface SecurityAnswer {

  id: number;


  /**
   * 이미지 기준 %
   *
   * 0 ~ 100
   */
  x: number;

  y: number;


  /**
   * 클릭 허용 반경 %
   */
  radius: number;


  /**
   * 신규 구조 핵심
   *
   * 14개 보안 취약점 중
   * 이 위치에 해당하는 실제 정답
   */
  vulnerabilityId?:
    SecurityVulnerabilityId;


  /*
   * ---------------------------------------------------------
   * Legacy / 설명 데이터
   *
   * 기존 데이터 호환을 위해 유지합니다.
   *
   * 추후 관리자 화면에서는
   * vulnerabilityId 선택만으로도 운영 가능합니다.
   * ---------------------------------------------------------
   */

  title: string;

  hint: string;

  explanation: string;
}


/* =========================================================
   Question
========================================================= */

export interface Question {

  id: string;


  /**
   * 관리자용 문제 제목
   *
   * 예:
   * 간호사 스테이션 - 화면 잠금
   */
  title: string;


  /* =======================================================
     신규 이미지 구조
  ======================================================= */

  /**
   * 실제 게임에서 보여주는
   * 보안취약점 이미지 1장
   */
  imageUrl?: string;

  imageId?: string;


  /**
   * 신규 구조:
   * 문제당 정답 1개
   */
  answer?: SecurityAnswer;


  /**
   * 4지선다 오답 후보에서 제외할 취약점 목록
   *
   * 예:
   * 정답이 EMR 화면 노출인데
   * 환자명 노출도 정답처럼 보일 수 있는 장면이라면
   *
   * excludedChoiceIds: [
   *   'PATIENT_NAME_EXPOSED'
   * ]
   *
   * 처럼 저장합니다.
   *
   * 정답 자체는 GamePage에서 자동으로 제외되므로
   * 여기에 넣을 필요가 없습니다.
   */
  excludedChoiceIds?:
    SecurityVulnerabilityId[];


  /* =======================================================
     Legacy 호환 필드
  ======================================================= */

  /**
   * 기존 정상 이미지
   *
   * 새 문제에서는 사용하지 않습니다.
   */
  normalImageUrl: string;

  normalImageId?: string;


  /**
   * 기존 위험 이미지
   *
   * 신규 imageId가 없으면
   * riskImageId를 fallback으로 사용합니다.
   */
  riskImageUrl: string;

  riskImageId?: string;


  /**
   * 기존 복수 정답 구조
   *
   * 신규 구조에서는
   * answers[0]을 answer로 변환할 수 있도록 유지
   */
  answers: SecurityAnswer[];


  /* =======================================================
     Game Settings
  ======================================================= */

  timeLimit?: number;

  lives?: number;

  hintCount?: number;


  active: boolean;


  createdAt?: string;

  updatedAt?: string;
}


/* =========================================================
   Game Config
========================================================= */

export interface GameConfig {

  gameTitle: string;


  defaultTimeLimit: number;

  defaultLives: number;

  defaultHintCount: number;


  /**
   * 한 게임에서 사용할 문제 수
   *
   * 신규 게임 기본값:
   * 3
   */
  questionsPerGame?: number;


  campaignSlogan?: string;
}


/* =========================================================
   API Response
========================================================= */

export interface ApiResponse<T = unknown> {

  success: boolean;


  data?: T;


  error?: string;

  message?: string;


  authenticated?: boolean;


  id?: string;


  active?: boolean;
}


/* =========================================================
   Question Save Payload
========================================================= */

export interface SaveQuestionPayload {

  id?: string;


  title: string;


  /* =======================================================
     신규 이미지
  ======================================================= */

  /**
   * 새 취약점 이미지 업로드
   */
  imageBase64?: string;


  /**
   * 기존 이미지 유지
   */
  imageUrl?: string;

  imageId?: string;


  /**
   * 신규 단일 정답
   */
  answer?: SecurityAnswer;


  /**
   * 이 문제의 4지선다에서
   * 오답 후보로 사용하지 않을 취약점 목록
   */
  excludedChoiceIds?:
    SecurityVulnerabilityId[];


  /* =======================================================
     Legacy 이미지
  ======================================================= */

  /**
   * 기존 파일들과의 컴파일 호환을 위해
   * 당분간 유지
   */
  normalImageBase64?: string;

  riskImageBase64?: string;


  normalImageUrl?: string;

  normalImageId?: string;


  riskImageUrl?: string;

  riskImageId?: string;


  /**
   * 기존 정답 배열
   *
   * 추후 QuestionEditor 변경 후
   * answer 하나만 저장하는 구조로 전환 예정
   */
  answers: SecurityAnswer[];


  /* =======================================================
     Game Settings
  ======================================================= */

  timeLimit: number;

  lives: number;

  hintCount: number;


  active: boolean;
}


/* =========================================================
   Drive Image
========================================================= */

export interface DriveImageData {

  fileId: string;

  mimeType: string;

  base64: string;
}


/* =========================================================
   이미지 Cache
========================================================= */

/**
 * 동일한 Drive 이미지를
 * Apps Script에서 반복적으로 Base64 조회하지 않도록
 * 브라우저 메모리에 cache
 */
const imageDataUrlCache =
  new Map<
    string,
    string
  >();


/* =========================================================
   Apps Script Response Parser
========================================================= */

async function parseAppsScriptResponse<T>(
  response: Response
):
Promise<ApiResponse<T>> {

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';


  const text =
    await response.text();


  const trimmed =
    text
      .trim()
      .toLowerCase();


  /* ---------------------------------------------------------
     HTML Response 감지
  --------------------------------------------------------- */

  if (
    contentType.includes(
      'text/html'
    ) ||

    trimmed.startsWith(
      '<!doctype'
    ) ||

    trimmed.startsWith(
      '<html'
    )
  ) {

    return {

      success:
        false,


      error:
        'Google Apps Script 웹앱에 접근할 수 없습니다. ' +
        'Apps Script 배포 설정을 확인해주세요.',
    };
  }


  /* ---------------------------------------------------------
     JSON 변환
  --------------------------------------------------------- */

  try {

    return JSON.parse(
      text
    ) as ApiResponse<T>;

  } catch (error) {

    console.error(
      'Apps Script 응답 파싱 오류:',
      error,
      text
    );


    return {

      success:
        false,


      error:
        '서버 응답 형식이 올바르지 않습니다.',
    };
  }
}


/* =========================================================
   Common GET
========================================================= */

async function getFromAppsScript<T>(
  params:
    Record<
      string,
      string
    >
):
Promise<ApiResponse<T>> {

  try {

    const query =
      new URLSearchParams(
        params
      ).toString();


    const response =
      await fetch(
        `${API_URL}?${query}`,
        {

          method:
            'GET',


          redirect:
            'follow',


          cache:
            'no-store',
        }
      );


    return await parseAppsScriptResponse<T>(
      response
    );

  } catch (error) {

    console.error(
      'Apps Script GET 오류:',
      error
    );


    return {

      success:
        false,


      error:
        'API 서버에 연결할 수 없습니다.',
    };
  }
}


/* =========================================================
   Common POST
========================================================= */

async function postToAppsScript<T>(
  body:
    Record<
      string,
      unknown
    >
):
Promise<ApiResponse<T>> {

  try {

    const response =
      await fetch(
        API_URL,
        {

          method:
            'POST',


          /*
           * Apps Script CORS preflight 방지
           */
          headers: {

            'Content-Type':
              'text/plain;charset=utf-8',
          },


          body:
            JSON.stringify(
              body
            ),


          redirect:
            'follow',
        }
      );


    return await parseAppsScriptResponse<T>(
      response
    );

  } catch (error) {

    console.error(
      'Apps Script POST 오류:',
      error
    );


    return {

      success:
        false,


      error:
        'API 서버에 연결할 수 없습니다.',
    };
  }
}


/* =========================================================
   1. Health
========================================================= */

export async function healthCheck():
Promise<ApiResponse<unknown>> {

  return await getFromAppsScript(
    {

      action:
        'health',
    }
  );
}


/* =========================================================
   2. Admin Password
========================================================= */

export async function verifyAdminPassword(
  adminPassword:
    string
):
Promise<
  ApiResponse<{
    authenticated:
      boolean;
  }>
> {

  const password =
    adminPassword.trim();


  if (!password) {

    return {

      success:
        false,


      authenticated:
        false,


      error:
        '관리자 비밀번호를 입력해주세요.',
    };
  }


  const result =
    await postToAppsScript<{
      authenticated:
        boolean;
    }>({

      action:
        'verifyAdmin',


      adminPassword:
        password,
    });


  if (
    result.success ===
      true &&

    result.authenticated ===
      true
  ) {

    return {

      success:
        true,


      authenticated:
        true,


      data: {

        authenticated:
          true,
      },


      message:
        result.message ||
        '관리자 인증에 성공했습니다.',
    };
  }


  return {

    success:
      false,


    authenticated:
      false,


    error:
      result.error ||
      '관리자 비밀번호가 올바르지 않습니다.',
  };
}


/* =========================================================
   3. Game Config
========================================================= */

export async function getConfig():
Promise<ApiResponse<GameConfig>> {

  const result =
    await getFromAppsScript<GameConfig>(
      {

        action:
          'config',
      }
    );


  /*
   * 설정 조회 실패 시에도
   * 게임 자체는 실행되도록 기본값 사용
   */
  if (
    !result.success ||
    !result.data
  ) {

    console.warn(
      'Config 조회 실패. 기본 설정 사용:',
      result.error
    );


    return {

      success:
        true,


      data: {

        ...DEFAULT_CONFIG,


        questionsPerGame:
          3,
      },
    };
  }


  return {

    success:
      true,


    data: {

      gameTitle:
        result.data
          .gameTitle ||
        DEFAULT_CONFIG
          .gameTitle,


      defaultTimeLimit:
        Number(
          result.data
            .defaultTimeLimit ??
          DEFAULT_CONFIG
            .defaultTimeLimit
        ),


      defaultLives:
        Number(
          result.data
            .defaultLives ??
          DEFAULT_CONFIG
            .defaultLives
        ),


      /*
       * 0회 힌트 허용
       */
      defaultHintCount:
        Number(
          result.data
            .defaultHintCount ??
          DEFAULT_CONFIG
            .defaultHintCount
        ),


      questionsPerGame:
        Number(
          result.data
            .questionsPerGame ??
          3
        ),


      campaignSlogan:
        result.data
          .campaignSlogan ??
        DEFAULT_CONFIG
          .campaignSlogan,
    },
  };
}


/* =========================================================
   4. Questions
========================================================= */

export async function getQuestions():
Promise<ApiResponse<Question[]>> {

  const result =
    await getFromAppsScript<
      Question[]
    >({

      action:
        'questions',
    });


  if (
    !result.success
  ) {

    return {

      success:
        false,


      error:
        result.error ||
        '문제 데이터를 불러오지 못했습니다.',
    };
  }


  if (
    !Array.isArray(
      result.data
    )
  ) {

    return {

      success:
        false,


      error:
        '문제 데이터 형식이 올바르지 않습니다.',
    };
  }


  const questions =
    result.data.map(
      normalizeQuestion
    );


  return {

    success:
      true,


    data:
      questions,
  };
}


/* =========================================================
   5. Single Question
========================================================= */

export async function getQuestion(
  id:
    string
):
Promise<ApiResponse<Question>> {

  if (!id) {

    return {

      success:
        false,


      error:
        '문제 ID가 없습니다.',
    };
  }


  const result =
    await getFromAppsScript<Question>(
      {

        action:
          'question',

        id,
      }
    );


  if (
    !result.success ||
    !result.data
  ) {

    return {

      success:
        false,


      error:
        result.error ||
        '문제를 찾을 수 없습니다.',
    };
  }


  return {

    success:
      true,


    data:
      normalizeQuestion(
        result.data
      ),
  };
}


/* =========================================================
   6. Drive Image
========================================================= */

export async function getDriveImage(
  fileId:
    string
):
Promise<
  ApiResponse<
    DriveImageData
  >
> {

  if (!fileId) {

    return {

      success:
        false,


      error:
        '이미지 fileId가 없습니다.',
    };
  }


  return await getFromAppsScript<
    DriveImageData
  >({

    action:
      'image',


    fileId,
  });
}


/* =========================================================
   7. Drive Image → Data URL
========================================================= */

export async function getDriveImageDataUrl(
  fileId:
    string
):
Promise<
  ApiResponse<string>
> {

  if (!fileId) {

    return {

      success:
        false,


      error:
        '이미지 fileId가 없습니다.',
    };
  }


  /* ---------------------------------------------------------
     Cache
  --------------------------------------------------------- */

  const cached =
    imageDataUrlCache.get(
      fileId
    );


  if (cached) {

    return {

      success:
        true,


      data:
        cached,
    };
  }


  /* ---------------------------------------------------------
     Apps Script 조회
  --------------------------------------------------------- */

  const result =
    await getDriveImage(
      fileId
    );


  if (
    !result.success ||
    !result.data
  ) {

    return {

      success:
        false,


      error:
        result.error ||
        '이미지를 불러오지 못했습니다.',
    };
  }


  const {
    mimeType,
    base64,
  } =
    result.data;


  if (
    !mimeType ||
    !base64
  ) {

    return {

      success:
        false,


      error:
        '이미지 데이터가 올바르지 않습니다.',
    };
  }


  const dataUrl =
    `data:${mimeType};base64,${base64}`;


  imageDataUrlCache.set(
    fileId,
    dataUrl
  );


  return {

    success:
      true,


    data:
      dataUrl,
  };
}


/* =========================================================
   8. 신규 구조:
      Question → 실제 게임 이미지 1장
========================================================= */

/**
 * 신규 게임에서는
 * 이 함수를 사용합니다.
 *
 * 우선순위:
 *
 * 1. imageId
 * 2. imageUrl
 * 3. riskImageId
 * 4. riskImageUrl
 */
export async function resolveQuestionImage(
  question:
    Question
):
Promise<
  ApiResponse<{
    imageSrc:
      string;
  }>
> {

  let imageSrc =
    '';


  /* ---------------------------------------------------------
     1. 신규 Drive Image
  --------------------------------------------------------- */

  if (
    question.imageId
  ) {

    const result =
      await getDriveImageDataUrl(
        question.imageId
      );


    if (
      result.success &&
      result.data
    ) {

      imageSrc =
        result.data;
    }
  }


  /* ---------------------------------------------------------
     2. 신규 URL
  --------------------------------------------------------- */

  if (
    !imageSrc &&
    question.imageUrl
  ) {

    imageSrc =
      question.imageUrl;
  }


  /* ---------------------------------------------------------
     3. 기존 Risk Drive Image
  --------------------------------------------------------- */

  if (
    !imageSrc &&
    question.riskImageId
  ) {

    const result =
      await getDriveImageDataUrl(
        question.riskImageId
      );


    if (
      result.success &&
      result.data
    ) {

      imageSrc =
        result.data;
    }
  }


  /* ---------------------------------------------------------
     4. 기존 Risk URL
  --------------------------------------------------------- */

  if (
    !imageSrc &&
    question.riskImageUrl
  ) {

    imageSrc =
      question.riskImageUrl;
  }


  if (!imageSrc) {

    return {

      success:
        false,


      error:
        '보안 취약점 이미지를 불러오지 못했습니다.',
    };
  }


  return {

    success:
      true,


    data: {

      imageSrc,
    },
  };
}


/* =========================================================
   9. Legacy:
      Normal + Risk Images
========================================================= */

/**
 * 기존 GamePage / QuestionEditor가
 * 아직 사용하고 있으므로 유지합니다.
 *
 * 새 GamePage로 변경한 뒤에는
 * resolveQuestionImage()가 주 함수가 됩니다.
 */
export async function resolveQuestionImages(
  question:
    Question
):
Promise<
  ApiResponse<{
    normalImageSrc:
      string;

    riskImageSrc:
      string;
  }>
> {

  let normalImageSrc =
    '';

  let riskImageSrc =
    '';


  /* ---------------------------------------------------------
     Normal
  --------------------------------------------------------- */

  if (
    question.normalImageId
  ) {

    const normalResult =
      await getDriveImageDataUrl(
        question.normalImageId
      );


    if (
      normalResult.success &&
      normalResult.data
    ) {

      normalImageSrc =
        normalResult.data;
    }

  } else if (
    question.normalImageUrl
  ) {

    normalImageSrc =
      question.normalImageUrl;
  }


  /* ---------------------------------------------------------
     Risk
  --------------------------------------------------------- */

  if (
    question.riskImageId
  ) {

    const riskResult =
      await getDriveImageDataUrl(
        question.riskImageId
      );


    if (
      riskResult.success &&
      riskResult.data
    ) {

      riskImageSrc =
        riskResult.data;
    }

  } else if (
    question.riskImageUrl
  ) {

    riskImageSrc =
      question.riskImageUrl;
  }


  /*
   * 신규 image만 있는 경우
   * risk 이미지로 사용 가능하도록 fallback
   */
  if (
    !riskImageSrc
  ) {

    const newResult =
      await resolveQuestionImage(
        question
      );


    if (
      newResult.success &&
      newResult.data
    ) {

      riskImageSrc =
        newResult.data
          .imageSrc;
    }
  }


  /*
   * 기존 화면이 아직 정상 이미지를 요구하므로
   * 정상 이미지가 없고 risk만 있으면
   * 당분간 risk를 fallback으로 사용
   *
   * 새 GamePage 변경 후에는
   * 이 로직을 사용하지 않습니다.
   */
  if (
    !normalImageSrc &&
    riskImageSrc
  ) {

    normalImageSrc =
      riskImageSrc;
  }


  if (
    !normalImageSrc ||
    !riskImageSrc
  ) {

    return {

      success:
        false,


      error:
        '문제 이미지를 불러오지 못했습니다.',
    };
  }


  return {

    success:
      true,


    data: {

      normalImageSrc,

      riskImageSrc,
    },
  };
}


/* =========================================================
   10. Image Cache
========================================================= */

export function clearImageCache(
  fileId?:
    string
):
void {

  if (
    fileId
  ) {

    imageDataUrlCache.delete(
      fileId
    );


    return;
  }


  imageDataUrlCache.clear();
}


/* =========================================================
   11. Save Question
========================================================= */

export async function saveQuestion(
  payload:
    SaveQuestionPayload,

  adminPassword:
    string
):
Promise<
  ApiResponse<{
    id:
      string;
  }>
> {

  if (
    !adminPassword
  ) {

    return {

      success:
        false,


      error:
        '관리자 인증 정보가 없습니다.',
    };
  }


  const result =
    await postToAppsScript<{
      id:
        string;
    }>({

      action:
        'saveQuestion',


      adminPassword,


      ...payload,
    });


  /* ---------------------------------------------------------
     현재 Apps Script 응답

     {
       success: true,
       id: "..."
     }
  --------------------------------------------------------- */

  if (
    result.success ===
      true &&

    result.id
  ) {

    clearImageCache();


    return {

      success:
        true,


      data: {

        id:
          String(
            result.id
          ),
      },


      message:
        result.message ||
        '문제가 저장되었습니다.',
    };
  }


  /* ---------------------------------------------------------
     향후 data.id 응답 구조 지원
  --------------------------------------------------------- */

  if (
    result.success ===
      true &&

    result.data &&

    typeof result.data ===
      'object' &&

    'id' in result.data
  ) {

    const responseData =
      result.data as {
        id:
          string;
      };


    clearImageCache();


    return {

      success:
        true,


      data: {

        id:
          String(
            responseData.id
          ),
      },


      message:
        result.message ||
        '문제가 저장되었습니다.',
    };
  }


  return {

    success:
      false,


    error:
      result.error ||
      '문제를 저장하지 못했습니다.',
  };
}


/* =========================================================
   12. Delete Question
========================================================= */

export async function deleteQuestion(
  id:
    string,

  adminPassword:
    string
):
Promise<
  ApiResponse<{
    deleted:
      boolean;
  }>
> {

  if (!id) {

    return {

      success:
        false,


      error:
        '삭제할 문제 ID가 없습니다.',
    };
  }


  if (
    !adminPassword
  ) {

    return {

      success:
        false,


      error:
        '관리자 인증 정보가 없습니다.',
    };
  }


  const result =
    await postToAppsScript({

      action:
        'deleteQuestion',


      adminPassword,


      id,
    });


  if (
    !result.success
  ) {

    return {

      success:
        false,


      error:
        result.error ||
        '문제를 삭제하지 못했습니다.',
    };
  }


  clearImageCache();


  return {

    success:
      true,


    data: {

      deleted:
        true,
    },


    message:
      result.message ||
      '문제가 삭제되었습니다.',
  };
}


/* =========================================================
   13. Toggle Question
========================================================= */

export async function toggleQuestion(
  id:
    string,

  active:
    boolean,

  adminPassword:
    string
):
Promise<
  ApiResponse<{
    active:
      boolean;
  }>
> {

  if (!id) {

    return {

      success:
        false,


      error:
        '문제 ID가 없습니다.',
    };
  }


  if (
    !adminPassword
  ) {

    return {

      success:
        false,


      error:
        '관리자 인증 정보가 없습니다.',
    };
  }


  const result =
    await postToAppsScript({

      action:
        'toggleQuestion',


      adminPassword,


      id,


      active,
    });


  if (
    !result.success
  ) {

    return {

      success:
        false,


      error:
        result.error ||
        '문제 상태를 변경하지 못했습니다.',
    };
  }


  return {

    success:
      true,


    data: {

      active:
        typeof result.active ===
          'boolean'
          ? result.active
          : active,
    },


    message:
      result.message ||
      (
        active
          ? '문제가 활성화되었습니다.'
          : '문제가 비활성화되었습니다.'
      ),
  };
}


/* =========================================================
   14. Question Normalize
========================================================= */

function normalizeQuestion(
  question:
    Question
):
Question {

  /* ---------------------------------------------------------
     기존 answers 배열 정규화
  --------------------------------------------------------- */

  const normalizedAnswers:
    SecurityAnswer[] =
      Array.isArray(
        question.answers
      )
        ? question.answers.map(
            (
              answer,
              index
            ) => ({

              ...answer,


              id:
                Number(
                  answer.id ??
                  index + 1
                ),


              x:
                Number(
                  answer.x
                ),


              y:
                Number(
                  answer.y
                ),


              radius:
                Number(
                  answer.radius ||
                  8
                ),


              vulnerabilityId:
                answer
                  .vulnerabilityId,


              title:
                answer.title ||
                `보안 위험 ${index + 1}`,


              hint:
                answer.hint ||
                '',


              explanation:
                answer
                  .explanation ||
                '',
            })
          )
        : [];


  /* ---------------------------------------------------------
     신규 단일 answer

     우선순위:
     question.answer
     ↓
     legacy answers[0]
  --------------------------------------------------------- */

  let normalizedAnswer:
    SecurityAnswer |
    undefined;


  if (
    question.answer
  ) {

    normalizedAnswer = {

      ...question.answer,


      id:
        Number(
          question.answer.id ||
          1
        ),


      x:
        Number(
          question.answer.x
        ),


      y:
        Number(
          question.answer.y
        ),


      radius:
        Number(
          question.answer.radius ||
          8
        ),


      vulnerabilityId:
        question.answer
          .vulnerabilityId,


      title:
        question.answer.title ||
        '보안 취약점',


      hint:
        question.answer.hint ||
        '',


      explanation:
        question.answer
          .explanation ||
        '',
    };

  } else if (
    normalizedAnswers.length >
    0
  ) {

    normalizedAnswer =
      normalizedAnswers[0];
  }


  /* ---------------------------------------------------------
     신규 image

     우선순위:
     image
     ↓
     기존 risk image
  --------------------------------------------------------- */

  const imageId =
    question.imageId
      ? String(
          question.imageId
        )
      : question.riskImageId
        ? String(
            question.riskImageId
          )
        : undefined;


  const imageUrl =
    question.imageUrl ||
    question.riskImageUrl ||
    '';


  /* ---------------------------------------------------------
     4지선다 제외 목록 정규화
  --------------------------------------------------------- */

  const normalizedExcludedChoiceIds:
    SecurityVulnerabilityId[] =
      Array.isArray(
        question.excludedChoiceIds
      )
        ? question.excludedChoiceIds
            .filter(
              (
                id
              ):
                id is SecurityVulnerabilityId =>
                  typeof id ===
                  'string'
            )
        : [];


  return {

    ...question,


    id:
      String(
        question.id
      ),


    title:
      question.title ||
      '보안 위험 찾기',


    /* =======================================================
       신규 필드
    ======================================================= */

    imageUrl,

    imageId,

    answer:
      normalizedAnswer,


    excludedChoiceIds:
      normalizedExcludedChoiceIds,


    /* =======================================================
       Legacy
    ======================================================= */

    normalImageUrl:
      question.normalImageUrl ||
      '',


    normalImageId:
      question.normalImageId
        ? String(
            question.normalImageId
          )
        : undefined,


    riskImageUrl:
      question.riskImageUrl ||
      imageUrl ||
      '',


    riskImageId:
      question.riskImageId
        ? String(
            question.riskImageId
          )
        : imageId,


    answers:
      normalizedAnswers.length >
        0
        ? normalizedAnswers
        : normalizedAnswer
          ? [
              normalizedAnswer,
            ]
          : [],


    /* =======================================================
       Settings
    ======================================================= */

    timeLimit:
      Number(
        question.timeLimit ??
        60
      ),


    lives:
      Number(
        question.lives ??
        3
      ),


    /*
     * 0회 허용
     */
    hintCount:
      Number(
        question.hintCount ??
        1
      ),


    active:
      question.active ===
        true ||

      String(
        question.active
      ).toLowerCase() ===
        'true',
  };
}