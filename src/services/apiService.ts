/**
 * Google Apps Script API Service
 *
 * Google Sheets + Google Drive를 사용하는
 * 정보보호 틀린그림찾기 게임 백엔드 통신 모듈
 *
 * 이미지 처리 방식:
 * - Google Drive 파일은 비공개
 * - Sheet에는 Drive fileId 저장
 * - Apps Script action=image API로 Base64 조회
 * - 브라우저에서는 data:image/... 형태로 표시
 */

import {
  API_URL,
  DEFAULT_CONFIG,
} from "../constants/config";


/* =========================================================
   Types
========================================================= */

export interface SecurityAnswer {
  id: number;

  x: number;
  y: number;

  radius: number;

  title: string;
  hint: string;
  explanation: string;
}


export interface Question {
  id: string;

  title: string;

  /**
   * 기존 호환성을 위해 유지
   * 앞으로 새 문제에서는 비어 있을 수 있음
   */
  normalImageUrl: string;
  normalImageId?: string;

  riskImageUrl: string;
  riskImageId?: string;

  answers: SecurityAnswer[];

  timeLimit?: number;
  lives?: number;
  hintCount?: number;

  active: boolean;

  createdAt?: string;
  updatedAt?: string;
}


export interface GameConfig {
  gameTitle: string;

  defaultTimeLimit: number;
  defaultLives: number;
  defaultHintCount: number;

  campaignSlogan?: string;
}


export interface ApiResponse<T = unknown> {
  success: boolean;

  data?: T;

  error?: string;
  message?: string;

  authenticated?: boolean;

  id?: string;

  active?: boolean;
}


export interface SaveQuestionPayload {
  id?: string;

  title: string;

  normalImageBase64?: string;
  riskImageBase64?: string;

  /**
   * 기존 이미지 수정 시
   * 기존 fileId를 유지하기 위해 사용
   */
  normalImageUrl?: string;
  normalImageId?: string;

  riskImageUrl?: string;
  riskImageId?: string;

  answers: SecurityAnswer[];

  timeLimit: number;
  lives: number;
  hintCount: number;

  active: boolean;
}


export interface DriveImageData {
  fileId: string;
  mimeType: string;
  base64: string;
}


/* =========================================================
   이미지 Cache

   동일한 Drive 이미지를 계속 Base64 API로 읽는 것을 방지
========================================================= */

const imageDataUrlCache =
  new Map<string, string>();


/* =========================================================
   Apps Script 응답 Parser
========================================================= */

/**
 * Apps Script는 경우에 따라
 * Google 로그인 HTML / Redirect 페이지를 반환할 수 있음
 *
 * 따라서 response.json()을 바로 사용하지 않고
 * text로 읽은 후 JSON 변환
 */
async function parseAppsScriptResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const text =
    await response.text();


  const trimmed =
    text
      .trim()
      .toLowerCase();


  /* ---------------------------------------------------------
     HTML 응답 감지
  --------------------------------------------------------- */

  if (
    contentType.includes(
      "text/html"
    ) ||
    trimmed.startsWith(
      "<!doctype"
    ) ||
    trimmed.startsWith(
      "<html"
    )
  ) {

    return {
      success: false,

      error:
        "Google Apps Script 웹앱에 접근할 수 없습니다. " +
        "Apps Script 배포 설정을 확인해주세요.",
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
      "Apps Script 응답 파싱 오류:",
      error,
      text
    );

    return {
      success: false,

      error:
        "서버 응답 형식이 올바르지 않습니다.",
    };
  }
}


/* =========================================================
   공통 GET
========================================================= */

async function getFromAppsScript<T>(
  params: Record<
    string,
    string
  >
): Promise<ApiResponse<T>> {

  try {

    const query =
      new URLSearchParams(
        params
      ).toString();


    const response =
      await fetch(
        `${API_URL}?${query}`,
        {
          method: "GET",

          redirect:
            "follow",

          cache:
            "no-store",
        }
      );


    return await parseAppsScriptResponse<T>(
      response
    );

  } catch (error) {

    console.error(
      "Apps Script GET 오류:",
      error
    );

    return {
      success: false,

      error:
        "API 서버에 연결할 수 없습니다.",
    };
  }
}


/* =========================================================
   공통 POST
========================================================= */

async function postToAppsScript<T>(
  body: Record<
    string,
    unknown
  >
): Promise<ApiResponse<T>> {

  try {

    const response =
      await fetch(
        API_URL,
        {
          method:
            "POST",

          /**
           * Apps Script CORS preflight를 줄이기 위해
           * application/json 대신 text/plain 사용
           */
          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body:
            JSON.stringify(
              body
            ),

          redirect:
            "follow",
        }
      );


    return await parseAppsScriptResponse<T>(
      response
    );

  } catch (error) {

    console.error(
      "Apps Script POST 오류:",
      error
    );

    return {
      success: false,

      error:
        "API 서버에 연결할 수 없습니다.",
    };
  }
}


/* =========================================================
   1. Health Check
========================================================= */

export async function healthCheck():
Promise<ApiResponse<unknown>> {

  return await getFromAppsScript(
    {
      action:
        "health",
    }
  );
}


/* =========================================================
   2. 관리자 비밀번호 검증
========================================================= */

export async function verifyAdminPassword(
  adminPassword: string
): Promise<
  ApiResponse<{
    authenticated: boolean;
  }>
> {

  const password =
    adminPassword.trim();


  if (!password) {

    return {
      success: false,

      authenticated:
        false,

      error:
        "관리자 비밀번호를 입력해주세요.",
    };
  }


  const result =
    await postToAppsScript<{
      authenticated: boolean;
    }>({
      action:
        "verifyAdmin",

      adminPassword:
        password,
    });


  if (
    result.success === true &&
    result.authenticated === true
  ) {

    return {
      success: true,

      authenticated:
        true,

      data: {
        authenticated:
          true,
      },

      message:
        result.message ||
        "관리자 인증에 성공했습니다.",
    };
  }


  return {
    success: false,

    authenticated:
      false,

    error:
      result.error ||
      "관리자 비밀번호가 올바르지 않습니다.",
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
          "config",
      }
    );


  /**
   * Config는 게임 자체가 완전히 멈추지 않도록
   * 조회 실패 시 기본값 사용
   */
  if (
    !result.success ||
    !result.data
  ) {

    console.warn(
      "Config 조회 실패. 기본 설정 사용:",
      result.error
    );


    return {
      success: true,

      data:
        DEFAULT_CONFIG,
    };
  }


  return {
    success: true,

    data: {

      gameTitle:
        result.data
          .gameTitle ||
        DEFAULT_CONFIG
          .gameTitle,

      defaultTimeLimit:
        Number(
          result.data
            .defaultTimeLimit ||
          DEFAULT_CONFIG
            .defaultTimeLimit
        ),

      defaultLives:
        Number(
          result.data
            .defaultLives ||
          DEFAULT_CONFIG
            .defaultLives
        ),

      defaultHintCount:
        Number(
          result.data
            .defaultHintCount ||
          DEFAULT_CONFIG
            .defaultHintCount
        ),

      campaignSlogan:
        result.data
          .campaignSlogan,
    },
  };
}


/* =========================================================
   4. 전체 문제 조회
========================================================= */

export async function getQuestions():
Promise<ApiResponse<Question[]>> {

  const result =
    await getFromAppsScript<
      Question[]
    >({
      action:
        "questions",
    });


  if (!result.success) {

    return {
      success: false,

      error:
        result.error ||
        "문제 데이터를 불러오지 못했습니다.",
    };
  }


  if (
    !Array.isArray(
      result.data
    )
  ) {

    return {
      success: false,

      error:
        "문제 데이터 형식이 올바르지 않습니다.",
    };
  }


  const questions =
    result.data.map(
      normalizeQuestion
    );


  return {
    success: true,

    data:
      questions,
  };
}


/* =========================================================
   5. 문제 한 건 조회
========================================================= */

export async function getQuestion(
  id: string
): Promise<ApiResponse<Question>> {

  if (!id) {

    return {
      success: false,

      error:
        "문제 ID가 없습니다.",
    };
  }


  const result =
    await getFromAppsScript<Question>(
      {
        action:
          "question",

        id,
      }
    );


  if (
    !result.success ||
    !result.data
  ) {

    return {
      success: false,

      error:
        result.error ||
        "문제를 찾을 수 없습니다.",
    };
  }


  return {
    success: true,

    data:
      normalizeQuestion(
        result.data
      ),
  };
}


/* =========================================================
   6. Drive 이미지 조회

   Apps Script:
   ?action=image&fileId=xxxx
========================================================= */

export async function getDriveImage(
  fileId: string
): Promise<
  ApiResponse<DriveImageData>
> {

  if (!fileId) {

    return {
      success: false,

      error:
        "이미지 fileId가 없습니다.",
    };
  }


  return await getFromAppsScript<
    DriveImageData
  >({
    action:
      "image",

    fileId,
  });
}


/* =========================================================
   7. Drive 이미지 → 브라우저용 Data URL
========================================================= */

/**
 * 예:
 *
 * data:image/jpeg;base64,/9j/4AAQ...
 *
 * 반환된 값을 그대로
 *
 * <img src={...} />
 *
 * 에 사용 가능
 */
export async function getDriveImageDataUrl(
  fileId: string
): Promise<
  ApiResponse<string>
> {

  if (!fileId) {

    return {
      success: false,

      error:
        "이미지 fileId가 없습니다.",
    };
  }


  /* ---------------------------------------------------------
     Cache 확인
  --------------------------------------------------------- */

  const cached =
    imageDataUrlCache.get(
      fileId
    );


  if (cached) {

    return {
      success: true,

      data:
        cached,
    };
  }


  /* ---------------------------------------------------------
     Apps Script에서 이미지 조회
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
      success: false,

      error:
        result.error ||
        "이미지를 불러오지 못했습니다.",
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
      success: false,

      error:
        "이미지 데이터가 올바르지 않습니다.",
    };
  }


  const dataUrl =
    `data:${mimeType};base64,${base64}`;


  /* ---------------------------------------------------------
     메모리 Cache
  --------------------------------------------------------- */

  imageDataUrlCache.set(
    fileId,
    dataUrl
  );


  return {
    success: true,

    data:
      dataUrl,
  };
}


/* =========================================================
   8. Question의 실제 이미지 src 조회

   신규 구조:
   fileId → Apps Script Base64

   기존 데이터:
   URL이 남아있으면 fallback 지원
========================================================= */

export async function resolveQuestionImages(
  question: Question
): Promise<
  ApiResponse<{
    normalImageSrc: string;
    riskImageSrc: string;
  }>
> {

  let normalImageSrc =
    "";

  let riskImageSrc =
    "";


  /* ---------------------------------------------------------
     정상 이미지
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

    /**
     * 기존 공개 URL 데이터 호환용
     * 새 문제에서는 사용하지 않음
     */
    normalImageSrc =
      question.normalImageUrl;
  }


  /* ---------------------------------------------------------
     위험 이미지
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


  /* ---------------------------------------------------------
     검증
  --------------------------------------------------------- */

  if (
    !normalImageSrc ||
    !riskImageSrc
  ) {

    return {
      success: false,

      error:
        "정상 이미지 또는 보안 이슈 이미지를 불러오지 못했습니다.",
    };
  }


  return {
    success: true,

    data: {
      normalImageSrc,
      riskImageSrc,
    },
  };
}


/* =========================================================
   9. 이미지 Cache 초기화
========================================================= */

export function clearImageCache(
  fileId?: string
): void {

  if (fileId) {

    imageDataUrlCache.delete(
      fileId
    );

    return;
  }


  imageDataUrlCache.clear();
}


/* =========================================================
   10. 문제 저장
========================================================= */

export async function saveQuestion(
  payload: SaveQuestionPayload,
  adminPassword: string
): Promise<
  ApiResponse<{
    id: string;
  }>
> {

  if (!adminPassword) {

    return {
      success: false,

      error:
        "관리자 인증 정보가 없습니다.",
    };
  }


  const result =
    await postToAppsScript<{
      id: string;
    }>({
      action:
        "saveQuestion",

      adminPassword,

      ...payload,
    });


  /**
   * Apps Script 현재 응답:
   *
   * {
   *   success: true,
   *   id: "...",
   *   message: "..."
   * }
   */
  if (
    result.success === true &&
    result.id
  ) {

    /**
     * 새 이미지가 저장됐을 수 있으므로
     * 기존 이미지 캐시 제거
     */
    clearImageCache();


    return {
      success: true,

      data: {
        id:
          String(
            result.id
          ),
      },

      message:
        result.message ||
        "문제가 저장되었습니다.",
    };
  }


  /**
   * 향후 data.id 구조도 지원
   */
  if (
    result.success === true &&
    result.data &&
    typeof result.data ===
      "object" &&
    "id" in result.data
  ) {

    const responseData =
      result.data as {
        id: string;
      };


    clearImageCache();


    return {
      success: true,

      data: {
        id:
          String(
            responseData.id
          ),
      },

      message:
        result.message ||
        "문제가 저장되었습니다.",
    };
  }


  return {
    success: false,

    error:
      result.error ||
      "문제를 저장하지 못했습니다.",
  };
}


/* =========================================================
   11. 문제 삭제
========================================================= */

export async function deleteQuestion(
  id: string,
  adminPassword: string
): Promise<
  ApiResponse<{
    deleted: boolean;
  }>
> {

  if (!id) {

    return {
      success: false,

      error:
        "삭제할 문제 ID가 없습니다.",
    };
  }


  if (!adminPassword) {

    return {
      success: false,

      error:
        "관리자 인증 정보가 없습니다.",
    };
  }


  const result =
    await postToAppsScript({
      action:
        "deleteQuestion",

      adminPassword,

      id,
    });


  if (!result.success) {

    return {
      success: false,

      error:
        result.error ||
        "문제를 삭제하지 못했습니다.",
    };
  }


  clearImageCache();


  return {
    success: true,

    data: {
      deleted:
        true,
    },

    message:
      result.message ||
      "문제가 삭제되었습니다.",
  };
}


/* =========================================================
   12. 문제 활성 / 비활성
========================================================= */

export async function toggleQuestion(
  id: string,
  active: boolean,
  adminPassword: string
): Promise<
  ApiResponse<{
    active: boolean;
  }>
> {

  if (!id) {

    return {
      success: false,

      error:
        "문제 ID가 없습니다.",
    };
  }


  if (!adminPassword) {

    return {
      success: false,

      error:
        "관리자 인증 정보가 없습니다.",
    };
  }


  const result =
    await postToAppsScript({
      action:
        "toggleQuestion",

      adminPassword,

      id,

      active,
    });


  if (!result.success) {

    return {
      success: false,

      error:
        result.error ||
        "문제 상태를 변경하지 못했습니다.",
    };
  }


  return {
    success: true,

    data: {
      active:
        typeof result.active ===
        "boolean"
          ? result.active
          : active,
    },

    message:
      result.message ||
      (
        active
          ? "문제가 활성화되었습니다."
          : "문제가 비활성화되었습니다."
      ),
  };
}


/* =========================================================
   Question 데이터 정규화
========================================================= */

function normalizeQuestion(
  question: Question
): Question {

  return {

    ...question,


    id:
      String(
        question.id
      ),


    title:
      question.title ||
      "보안 위험 찾기",


    /**
     * 새 구조에서는 빈 문자열이어도 정상
     */
    normalImageUrl:
      question.normalImageUrl ||
      "",


    normalImageId:
      question.normalImageId
        ? String(
            question.normalImageId
          )
        : undefined,


    riskImageUrl:
      question.riskImageUrl ||
      "",


    riskImageId:
      question.riskImageId
        ? String(
            question.riskImageId
          )
        : undefined,


    answers:
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


              title:
                answer.title ||
                `보안 위험 ${index + 1}`,


              hint:
                answer.hint ||
                "",


              explanation:
                answer.explanation ||
                "",
            })
          )
        : [],


    timeLimit:
      Number(
        question.timeLimit ||
        60
      ),


    lives:
      Number(
        question.lives ||
        3
      ),


    hintCount:
      Number(
        question.hintCount ||
        1
      ),


    active:
      question.active ===
        true ||
      String(
        question.active
      ).toLowerCase() ===
        "true",
  };
}