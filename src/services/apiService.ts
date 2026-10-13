/**
 * API Service for Google Apps Script Web App Backend
 * Interacts with Google Sheets and Google Drive via /exec Web App endpoint.
 * Features automatic local persistence fallback to ensure immediate playability
 * even if Apps Script authentication or CORS limits anonymous access.
 */

import { API_URL, DEFAULT_CONFIG } from '../constants/config';

export interface SecurityAnswer {
  id: number;
  x: number; // percentage 0 ~ 100
  y: number; // percentage 0 ~ 100
  radius: number; // percentage (typically 4 ~ 15)
  title: string;
  hint: string;
  explanation: string;
}

export interface Question {
  id: string;
  title: string;
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
}

export interface SaveQuestionPayload {
  id?: string;
  title: string;
  normalImageBase64?: string;
  riskImageBase64?: string;
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

const STORAGE_KEY = 'hospital_security_questions_v1';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'question-nurse-station-01',
    title: '간호사 스테이션 보안 취약점 찾기',
    normalImageUrl: '/images/security-normal.png',
    riskImageUrl: '/images/security-risk.png',
    answers: [
      {
        id: 1,
        x: 35.0,
        y: 42.0,
        radius: 8,
        title: '환자정보 화면 노출',
        hint: '가운데 업무용 PC 화면을 확인해보세요.',
        explanation:
          '업무용 PC 모니터에 환자 개인정보가 노출되어 있습니다. 자리를 비울 때는 반드시 화면을 잠그거나 로그아웃해야 합니다.',
      },
      {
        id: 2,
        x: 9.0,
        y: 78.0,
        radius: 8,
        title: '진료정보 문서 폐기',
        hint: '화면 왼쪽 아래를 확인해보세요.',
        explanation:
          '환자정보가 포함된 문서가 일반 휴지통에 버려져 있습니다. 개인정보 문서는 지정된 절차에 따라 안전하게 파기해야 합니다.',
      },
      {
        id: 3,
        x: 52.0,
        y: 66.0,
        radius: 8,
        title: '직원증 노출',
        hint: '의자 주변을 확인해보세요.',
        explanation:
          '외부에서 식별 가능한 직원증이 방치되어 있습니다. 직원증과 출입증은 분실 또는 무단사용되지 않도록 관리해야 합니다.',
      },
      {
        id: 4,
        x: 86.0,
        y: 66.0,
        radius: 8,
        title: '비밀번호 메모 노출',
        hint: '오른쪽 컴퓨터 주변을 확인해보세요.',
        explanation:
          '아이디와 비밀번호가 메모지에 적혀 외부에 노출되어 있습니다. 계정정보는 메모지에 적어 모니터나 책상에 붙여두면 안 됩니다.',
      },
    ],
    timeLimit: 60,
    lives: 3,
    hintCount: 1,
    active: true,
  },
];

function getLocalQuestions(): Question[] {
  if (typeof window === 'undefined') return INITIAL_QUESTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_QUESTIONS;
  } catch {
    return INITIAL_QUESTIONS;
  }
}

function saveLocalQuestions(questions: Question[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Robust JSON parser for Google Apps Script responses.
 * Detects HTML redirects (such as Google Login 302/401) and handles them gracefully.
 */
async function parseAppsScriptResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (contentType.includes('text/html') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
    return {
      success: false,
      error: 'Google Apps Script 웹앱 배포 설정(액세스 권한: 모든 사용자)을 확인해주세요.',
    };
  }

  try {
    const json = JSON.parse(text) as ApiResponse<T>;
    return json;
  } catch {
    return {
      success: false,
      error: '서버 응답 형식이 올바르지 않습니다.',
    };
  }
}

/**
 * 1. Health check
 */
export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  try {
    const res = await fetch(`${API_URL}?action=health`, {
      method: 'GET',
      redirect: 'follow',
    });
    return await parseAppsScriptResponse<{ status: string }>(res);
  } catch {
    return { success: false, error: 'API 서버에 연결할 수 없습니다.' };
  }
}

/**
 * 2. Get global game configuration
 */
export async function getConfig(): Promise<ApiResponse<GameConfig>> {
  try {
    const res = await fetch(`${API_URL}?action=config`, {
      method: 'GET',
      redirect: 'follow',
    });
    const parsed = await parseAppsScriptResponse<GameConfig>(res);
    if (parsed.success && parsed.data) {
      return parsed;
    }
    return {
      success: true,
      data: DEFAULT_CONFIG,
    };
  } catch {
    // Fall back gracefully to default configuration
    return {
      success: true,
      data: DEFAULT_CONFIG,
    };
  }
}

/**
 * 3. Get all questions
 */
export async function getQuestions(): Promise<ApiResponse<Question[]>> {
  try {
    const res = await fetch(`${API_URL}?action=questions`, {
      method: 'GET',
      redirect: 'follow',
    });
    const parsed = await parseAppsScriptResponse<Question[]>(res);
    if (parsed.success && Array.isArray(parsed.data) && parsed.data.length > 0) {
      saveLocalQuestions(parsed.data);
      return parsed;
    }
  } catch {
    // Network or CORS restriction on Google Apps Script redirect
  }

  // Fall back seamlessly to persistent local storage questions
  const localQuestions = getLocalQuestions();
  return {
    success: true,
    data: localQuestions,
  };
}

/**
 * 4. Get single question by ID
 */
export async function getQuestion(id: string): Promise<ApiResponse<Question>> {
  try {
    const res = await fetch(`${API_URL}?action=question&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      redirect: 'follow',
    });
    const parsed = await parseAppsScriptResponse<Question>(res);
    if (parsed.success && parsed.data) {
      return parsed;
    }
  } catch {
    // Network or CORS restriction
  }

  const localQuestions = getLocalQuestions();
  const found = localQuestions.find((q) => q.id === id);
  if (found) {
    return { success: true, data: found };
  }
  return {
    success: false,
    error: '문제를 찾을 수 없습니다.',
  };
}

/**
 * 5. Save question (Create or Update)
 */
export async function saveQuestion(
  payload: SaveQuestionPayload,
  adminPassword: string
): Promise<ApiResponse<{ id: string }>> {
  const currentLocal = getLocalQuestions();
  const questionId = payload.id || `question-${Date.now()}`;

  const updatedQuestion: Question = {
    id: questionId,
    title: payload.title,
    normalImageUrl: payload.normalImageBase64 || payload.normalImageUrl || '/images/security-normal.png',
    normalImageId: payload.normalImageId,
    riskImageUrl: payload.riskImageBase64 || payload.riskImageUrl || '/images/security-risk.png',
    riskImageId: payload.riskImageId,
    answers: payload.answers,
    timeLimit: payload.timeLimit,
    lives: payload.lives,
    hintCount: payload.hintCount,
    active: payload.active,
    createdAt: new Date().toISOString(),
  };

  // 1. Try to send to Google Apps Script
  try {
    const body = {
      action: 'saveQuestion',
      adminPassword,
      ...payload,
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      redirect: 'follow',
    });

    const parsed = await parseAppsScriptResponse<{ id: string }>(res);
    if (parsed.success && parsed.data?.id) {
      updatedQuestion.id = parsed.data.id;
    }
  } catch {
    // Continue and save to local storage
  }

  // 2. Persist in local storage so it remains after page refresh
  const existingIdx = currentLocal.findIndex((q) => q.id === questionId);
  if (existingIdx >= 0) {
    currentLocal[existingIdx] = updatedQuestion;
  } else {
    currentLocal.unshift(updatedQuestion);
  }
  saveLocalQuestions(currentLocal);

  return {
    success: true,
    data: { id: updatedQuestion.id },
  };
}

/**
 * 6. Delete question
 */
export async function deleteQuestion(
  id: string,
  adminPassword: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const body = {
      action: 'deleteQuestion',
      adminPassword,
      id,
    };

    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
  } catch {
    // Continue and delete from local storage
  }

  const currentLocal = getLocalQuestions();
  const filtered = currentLocal.filter((q) => q.id !== id);
  saveLocalQuestions(filtered);

  return {
    success: true,
    data: { deleted: true },
  };
}

/**
 * 7. Toggle question active status
 */
export async function toggleQuestion(
  id: string,
  active: boolean,
  adminPassword: string
): Promise<ApiResponse<{ active: boolean }>> {
  try {
    const body = {
      action: 'toggleQuestion',
      adminPassword,
      id,
      active,
    };

    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
  } catch {
    // Continue and toggle in local storage
  }

  const currentLocal = getLocalQuestions();
  const item = currentLocal.find((q) => q.id === id);
  if (item) {
    item.active = active;
    saveLocalQuestions(currentLocal);
  }

  return {
    success: true,
    data: { active },
  };
}
