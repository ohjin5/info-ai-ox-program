/**
 * Hospital Information Security Campaign Spot-the-Difference Game Data
 * 병원 정보보호 캠페인 "보안 위험을 찾아라!"
 */

export interface SecurityAnswer {
  id: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  radius: number; // percentage
  mobileRadius?: number; // optional mobile-friendly touch radius
  title: string;
  hint: string;
  explanation: string;
}

export interface GameConfig {
  title: string;
  subtitle: string;
  description: string;
  guideText: string;
  totalTimeSeconds: number;
  initialLives: number;
  initialHints: number;
  normalImagePath: string;
  riskImagePath: string;
  hospitalName: string;
  campaignSlogan: string;
}

export const GAME_CONFIG: GameConfig = {
  title: "보안 위험을 찾아라!",
  subtitle: "병원 정보보호 실천 캠페인",
  description: "두 사진을 비교하여 오른쪽 사진에 숨어 있는 보안 위험 4개를 모두 찾아보세요!",
  guideText: "오른쪽(보안 위험) 사진에서 취약한 부분을 직접 클릭하면 정답 여부를 확인할 수 있습니다.",
  totalTimeSeconds: 60,
  initialLives: 3,
  initialHints: 1,
  normalImagePath: "/images/security-normal.png",
  riskImagePath: "/images/security-risk.png",
  hospitalName: "의료정보보호센터",
  campaignSlogan: "작은 보안 습관이 소중한 환자 정보를 지킵니다.",
};

export const answers: SecurityAnswer[] = [
  {
    id: 1,
    x: 35,
    y: 42,
    radius: 8,
    mobileRadius: 10,
    title: "환자정보 화면 노출",
    hint: "가운데 업무용 PC 화면을 확인해보세요.",
    explanation:
      "업무용 PC 모니터에 환자 개인정보가 노출되어 있습니다. 자리를 비울 때는 반드시 화면을 잠그거나 로그아웃해야 합니다."
  },
  {
    id: 2,
    x: 9,
    y: 78,
    radius: 8,
    mobileRadius: 10,
    title: "진료정보 문서 폐기",
    hint: "화면 왼쪽 아래를 확인해보세요.",
    explanation:
      "환자정보가 포함된 문서가 일반 휴지통에 버려져 있습니다. 개인정보 문서는 지정된 절차에 따라 안전하게 파기해야 합니다."
  },
  {
    id: 3,
    x: 52,
    y: 66,
    radius: 8,
    mobileRadius: 10,
    title: "직원증 노출",
    hint: "의자 주변을 확인해보세요.",
    explanation:
      "외부에서 식별 가능한 직원증이 방치되어 있습니다. 직원증과 출입증은 분실 또는 무단사용되지 않도록 관리해야 합니다."
  },
  {
    id: 4,
    x: 86,
    y: 66,
    radius: 8,
    mobileRadius: 10,
    title: "비밀번호 메모 노출",
    hint: "오른쪽 컴퓨터 주변을 확인해보세요.",
    explanation:
      "아이디와 비밀번호가 메모지에 적혀 외부에 노출되어 있습니다. 계정정보는 메모지에 적어 모니터나 책상에 붙여두면 안 됩니다."
  }
];
