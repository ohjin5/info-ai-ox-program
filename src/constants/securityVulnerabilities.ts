/* =========================================================
   Security Vulnerability Catalog

   관리자 화면:
   - 정답 취약점 종류 선택
   - 문제별 4지선다 제외 항목 선택

   게임 화면:
   - 정답 1개
   - 제외 항목을 뺀 후보 중 랜덤 오답 3개
   - 총 4지선다 생성
========================================================= */


/* =========================================================
   취약점 ID
========================================================= */

export type SecurityVulnerabilityId =
  | 'SCREEN_UNLOCKED'
  | 'ACCOUNT_PASSWORD_EXPOSED'
  | 'PERSONAL_DOCUMENT_LEFT'
  | 'PRINTER_OUTPUT_LEFT'
  | 'PATIENT_NAME_EXPOSED'
  | 'EMR_SCREEN_EXPOSED'
  | 'UNAUTHORIZED_USB'
  | 'PERSONAL_MEMO_DISPOSAL'
  | 'PERSONAL_DOCUMENT_GENERAL_WASTE'
  | 'ACCOUNT_INFO_MEMO'
  | 'PERSONAL_DOCUMENT_PUBLIC'
  | 'PUBLIC_SPACE_PATIENT_INFO'
  | 'COPIER_OUTPUT_UNCOLLECTED'
  | 'PERSONAL_DOCUMENT_STORAGE'
  | 'WARD_BOARD_PATIENT_INFO';


/* =========================================================
   취약점 데이터 타입
========================================================= */

export interface SecurityVulnerability {

  id:
    SecurityVulnerabilityId;

  label:
    string;

  description:
    string;
}


/* =========================================================
   취약점 전체 목록
========================================================= */

export const SECURITY_VULNERABILITIES:
SecurityVulnerability[] = [

  {
    id:
      'SCREEN_UNLOCKED',

    label:
      '화면 잠금 미실시',

    description:
      '자리를 비운 상태에서 업무용 PC 화면이 잠기지 않아 다른 사람이 정보를 확인할 수 있는 상태입니다.',
  },


  {
    id:
      'ACCOUNT_PASSWORD_EXPOSED',

    label:
      '계정·비밀번호 노출',

    description:
      '아이디, 비밀번호 등 계정정보가 다른 사람이 확인할 수 있는 상태로 노출되어 있습니다.',
  },


  {
    id:
      'PERSONAL_DOCUMENT_LEFT',

    label:
      '개인정보 서류 방치',

    description:
      '환자 또는 교직원의 개인정보가 포함된 서류가 책상이나 업무공간에 방치되어 있습니다.',
  },


  {
    id:
      'PRINTER_OUTPUT_LEFT',

    label:
      '프린터 출력물 방치',

    description:
      '프린터에서 출력된 개인정보 또는 업무자료가 즉시 회수되지 않고 방치되어 있습니다.',
  },


  {
    id:
      'PATIENT_NAME_EXPOSED',

    label:
      '환자명 노출',

    description:
      '환자의 이름 등 식별정보가 불필요하게 다른 사람에게 노출되어 있습니다.',
  },


  {
    id:
      'EMR_SCREEN_EXPOSED',

    label:
      'EMR 화면 노출',

    description:
      'EMR 또는 의료정보시스템 화면이 주변 사람에게 노출되어 환자정보를 확인할 수 있는 상태입니다.',
  },


  {
    id:
      'UNAUTHORIZED_USB',

    label:
      '미승인 USB 사용',

    description:
      '병원에서 승인되지 않은 이동식 저장매체가 업무용 PC에 연결되어 있습니다.',
  },


  {
    id:
      'PERSONAL_MEMO_DISPOSAL',

    label:
      '개인정보 메모 폐기 미흡',

    description:
      '개인정보가 기록된 메모지가 안전하게 파기되지 않고 그대로 버려지거나 방치되어 있습니다.',
  },


  {
    id:
      'PERSONAL_DOCUMENT_GENERAL_WASTE',

    label:
      '개인정보 문서 일반폐기',

    description:
      '개인정보가 포함된 문서가 보안 파기 절차 없이 일반 쓰레기로 폐기되고 있습니다.',
  },


  {
    id:
      'ACCOUNT_INFO_MEMO',

    label:
      '계정정보 메모 방치',

    description:
      '아이디나 비밀번호 등 계정정보를 적은 메모지가 모니터나 책상 등에 방치되어 있습니다.',
  },


  {
    id:
      'PERSONAL_DOCUMENT_PUBLIC',

    label:
      '개인정보 문서 공개 방치',

    description:
      '개인정보가 포함된 문서가 방문객이나 다른 직원이 볼 수 있는 장소에 공개된 상태로 놓여 있습니다.',
  },


  {
    id:
      'PUBLIC_SPACE_PATIENT_INFO',

    label:
      '공용공간 환자정보 노출',

    description:
      '복도, 대기공간 등 여러 사람이 이용하는 장소에서 환자정보가 노출되어 있습니다.',
  },


  {
    id:
      'COPIER_OUTPUT_UNCOLLECTED',

    label:
      '복합기 출력물 미회수',

    description:
      '복사 또는 출력한 개인정보 문서가 복합기에 남아 즉시 회수되지 않은 상태입니다.',
  },


  {
    id:
      'PERSONAL_DOCUMENT_STORAGE',

    label:
      '개인정보 문서 보관 미흡',

    description:
      '개인정보 문서가 잠금장치나 적절한 접근통제 없이 보관되어 있습니다.',
  },


  {
    id:
      'WARD_BOARD_PATIENT_INFO',

    label:
      '병동 게시판 환자정보 노출',

    description:
      '병동 게시판이나 공개된 게시물에 환자 식별정보가 노출되어 있습니다.',
  },

];


/* =========================================================
   ID → 취약점 정보
========================================================= */

export const getSecurityVulnerabilityById =
  (
    id:
      string
  ):
    SecurityVulnerability |
    undefined => {

    return SECURITY_VULNERABILITIES
      .find(
        item =>
          item.id ===
          id
      );
  };


/* =========================================================
   ID → 표시 이름
========================================================= */

export const getSecurityVulnerabilityLabel =
  (
    id:
      string
  ):
    string => {

    return (
      getSecurityVulnerabilityById(
        id
      )?.label ||
      id
    );
  };


/* =========================================================
   배열 Shuffle
========================================================= */

const shuffleArray =
  <T,>(
    source:
      T[]
  ):
    T[] => {

    const result = [
      ...source,
    ];


    for (
      let i =
        result.length -
        1;

      i >
      0;

      i -=
        1
    ) {

      const j =
        Math.floor(
          Math.random() *
          (
            i +
            1
          )
        );


      [
        result[i],
        result[j],
      ] =
        [
          result[j],
          result[i],
        ];
    }


    return result;
  };


/* =========================================================
   4지선다 생성

   correctId:
   - 관리자에서 지정한 실제 정답

   choiceCount:
   - 총 선택지 개수
   - 기본 4개

   excludedChoiceIds:
   - 해당 문제에서 오답 후보로 절대 사용하지 않을
     취약점 ID 목록

   결과:
   - 정답 1개
   - 제외 목록을 제거한 오답 후보 중 랜덤 3개
   - 순서 랜덤
========================================================= */

export const createVulnerabilityChoices =
  (
    correctId:
      SecurityVulnerabilityId,

    choiceCount:
      number = 4,

    excludedChoiceIds:
      SecurityVulnerabilityId[] = []
  ):
    SecurityVulnerability[] => {

    /* -------------------------------------------------------
       정답
    ------------------------------------------------------- */

    const correct =
      SECURITY_VULNERABILITIES
        .find(
          item =>
            item.id ===
            correctId
        );


    if (
      !correct
    ) {

      return [];
    }


    /* -------------------------------------------------------
       제외 목록 정리

       - 중복 제거
       - 정답이 잘못 들어간 경우도 안전하게 처리
    ------------------------------------------------------- */

    const excludedSet =
      new Set<
        SecurityVulnerabilityId
      >(
        excludedChoiceIds
          .filter(
            id =>
              id !==
              correctId
          )
      );


    /* -------------------------------------------------------
       오답 후보 Pool

       제외:
       1. 정답
       2. 관리자 지정 제외항목
    ------------------------------------------------------- */

    const distractorPool =
      SECURITY_VULNERABILITIES
        .filter(
          item =>
            item.id !==
              correctId &&

            !excludedSet
              .has(
                item.id
              )
        );


    /* -------------------------------------------------------
       안전한 선택지 개수

       실제 가능한 개수보다
       큰 값을 요청해도 오류 방지
    ------------------------------------------------------- */

    const maxPossibleChoiceCount =
      distractorPool.length +
      1;


    const safeChoiceCount =
      Math.max(
        1,
        Math.min(
          choiceCount,
          maxPossibleChoiceCount
        )
      );


    const distractorCount =
      Math.max(
        0,
        safeChoiceCount -
        1
      );


    /* -------------------------------------------------------
       오답 후보 랜덤 선택
    ------------------------------------------------------- */

    const distractors =
      shuffleArray(
        distractorPool
      )
        .slice(
          0,
          distractorCount
        );


    /* -------------------------------------------------------
       최종 보기 랜덤 Shuffle
    ------------------------------------------------------- */

    return shuffleArray([
      correct,
      ...distractors,
    ]);
  };


/* =========================================================
   4지선다 생성 가능 여부

   관리자 저장 검증이나
   디버깅 용도로 사용할 수 있습니다.

   정답 1개 + 오답 3개가 가능하면 true
========================================================= */

export const canCreateVulnerabilityChoices =
  (
    correctId:
      SecurityVulnerabilityId,

    excludedChoiceIds:
      SecurityVulnerabilityId[] = [],

    choiceCount:
      number = 4
  ):
    boolean => {

    const excludedSet =
      new Set<
        SecurityVulnerabilityId
      >(
        excludedChoiceIds
          .filter(
            id =>
              id !==
              correctId
          )
      );


    const distractorCount =
      SECURITY_VULNERABILITIES
        .filter(
          item =>
            item.id !==
              correctId &&

            !excludedSet
              .has(
                item.id
              )
        )
        .length;


    const requiredDistractorCount =
      Math.max(
        0,
        choiceCount -
        1
      );


    return (
      distractorCount >=
      requiredDistractorCount
    );
  };


/* =========================================================
   사용 가능한 오답 후보 개수

   관리자 화면에서
   "현재 오답 후보 8개" 같은 표시가 필요할 때 사용 가능
========================================================= */

export const getAvailableDistractorCount =
  (
    correctId:
      SecurityVulnerabilityId,

    excludedChoiceIds:
      SecurityVulnerabilityId[] = []
  ):
    number => {

    const excludedSet =
      new Set<
        SecurityVulnerabilityId
      >(
        excludedChoiceIds
          .filter(
            id =>
              id !==
              correctId
          )
      );


    return SECURITY_VULNERABILITIES
      .filter(
        item =>
          item.id !==
            correctId &&

          !excludedSet
            .has(
              item.id
            )
      )
      .length;
  };


/* =========================================================
   랜덤 문제 선택

   ex)
   6개의 활성 문제 중 3개 선택
========================================================= */

export const pickRandomItems =
  <T,>(
    source:
      T[],

    count:
      number
  ):
    T[] => {

    if (
      source.length ===
      0
    ) {

      return [];
    }


    const safeCount =
      Math.max(
        0,
        Math.min(
          count,
          source.length
        )
      );


    return shuffleArray(
      source
    )
      .slice(
        0,
        safeCount
      );
  };