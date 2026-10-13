import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 800;

// Coordinate checks:
// 1. x: 35% -> 420px, y: 42% -> 336px (Center workstation monitor)
// 2. x: 9%  -> 108px, y: 78% -> 624px (Bottom-left trash bin)
// 3. x: 52% -> 624px, y: 66% -> 528px (Center office chair)
// 4. x: 86% -> 1032px, y: 66% -> 528px (Right workstation monitor & desk)

function createBaseSVG(isRisk) {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EBF3FA"/>
      <stop offset="100%" stop-color="#D9E6F2"/>
    </linearGradient>
    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#CFDCE8"/>
      <stop offset="100%" stop-color="#B8CADB"/>
    </linearGradient>
    <linearGradient id="counterTopGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="counterBodyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="woodPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="screenGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.18"/>
    </filter>
    <filter id="deskShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Wall Background -->
  <rect x="0" y="0" width="${WIDTH}" height="520" fill="url(#wallGrad)"/>

  <!-- Hospital Wall Trim / Band -->
  <rect x="0" y="160" width="${WIDTH}" height="32" fill="#0284C7" opacity="0.85"/>
  <rect x="0" y="192" width="${WIDTH}" height="6" fill="#0369A1"/>

  <!-- Signboard on Wall -->
  <g filter="url(#softShadow)">
    <rect x="420" y="40" width="360" height="72" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <rect x="420" y="40" width="12" height="72" rx="4" fill="#0284C7"/>
    <!-- Cross icon -->
    <rect x="444" y="66" width="20" height="20" rx="3" fill="#0284C7"/>
    <path d="M451 71 h6 v10 h-6 z M447 74 h14 v4 h-14 z" fill="#FFFFFF"/>
    <text x="475" y="73" font-family="'Pretendard', 'Apple SD Gothic Neo', sans-serif" font-weight="bold" font-size="20" fill="#0F172A">간호스테이션 (Station 3A)</text>
    <text x="475" y="94" font-family="'Pretendard', 'Apple SD Gothic Neo', sans-serif" font-size="12" fill="#64748B">HOSPITAL MEDICAL CENTER · WARD 3</text>
  </g>

  <!-- Digital Clock on Wall -->
  <g filter="url(#softShadow)">
    <rect x="880" y="52" width="140" height="48" rx="6" fill="#1E293B"/>
    <text x="950" y="84" font-family="monospace" font-weight="bold" font-size="22" fill="#38BDF8" text-anchor="middle">14:28:45</text>
  </g>

  <!-- Notice Board on Wall (Left) -->
  <g filter="url(#softShadow)">
    <rect x="80" y="50" width="220" height="90" rx="6" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/>
    <rect x="80" y="50" width="220" height="24" rx="4" fill="#475569"/>
    <text x="190" y="67" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="13" fill="#FFFFFF" text-anchor="middle">정보보호 10대 기본 수칙</text>
    <circle cx="100" cy="90" r="4" fill="#0284C7"/>
    <rect x="112" y="87" width="160" height="6" rx="3" fill="#94A3B8"/>
    <circle cx="100" cy="110" r="4" fill="#0284C7"/>
    <rect x="112" y="107" width="140" height="6" rx="3" fill="#94A3B8"/>
    <circle cx="100" cy="130" r="4" fill="#0284C7"/>
    <rect x="112" y="127" width="170" height="6" rx="3" fill="#94A3B8"/>
  </g>

  <!-- Wall Cabinets (Back) -->
  <rect x="180" y="210" width="840" height="150" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2" rx="4"/>
  <line x1="460" y1="210" x2="460" y2="360" stroke="#94A3B8" stroke-width="2"/>
  <line x1="740" y1="210" x2="740" y2="360" stroke="#94A3B8" stroke-width="2"/>
  <!-- Handles -->
  <rect x="445" y="275" width="6" height="30" rx="3" fill="#64748B"/>
  <rect x="469" y="275" width="6" height="30" rx="3" fill="#64748B"/>
  <rect x="725" y="275" width="6" height="30" rx="3" fill="#64748B"/>
  <rect x="749" y="275" width="6" height="30" rx="3" fill="#64748B"/>

  <!-- Floor -->
  <rect x="0" y="500" width="${WIDTH}" height="300" fill="url(#floorGrad)"/>
  <!-- Floor tiles grid lines -->
  <line x1="0" y1="580" x2="${WIDTH}" y2="580" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="8 6"/>
  <line x1="0" y1="670" x2="${WIDTH}" y2="670" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="8 6"/>
  <line x1="300" y1="500" x2="150" y2="800" stroke="#CBD5E1" stroke-width="1.5"/>
  <line x1="600" y1="500" x2="520" y2="800" stroke="#CBD5E1" stroke-width="1.5"/>
  <line x1="900" y1="500" x2="920" y2="800" stroke="#CBD5E1" stroke-width="1.5"/>

  <!-- Main Nurse Station Counter Desk -->
  <g filter="url(#deskShadow)">
    <!-- Counter Base -->
    <path d="M 40 430 L 1160 430 L 1140 680 L 60 680 Z" fill="url(#counterBodyGrad)"/>
    <!-- Decorative front wooden panel -->
    <rect x="120" y="460" width="960" height="190" rx="8" fill="url(#woodPanel)" stroke="#94A3B8" stroke-width="2"/>
    <text x="600" y="565" font-family="'Pretendard', sans-serif" font-weight="900" font-size="28" fill="#1E3A8A" letter-spacing="4" text-anchor="middle" opacity="0.35">NURSE STATION 3A</text>
    <!-- Counter Table Top -->
    <polygon points="20,430 1180,430 1150,380 50,380" fill="url(#counterTopGrad)" stroke="#CBD5E1" stroke-width="2"/>
  </g>

  <!-- Items on the Desk (General) -->
  <!-- Left Phone & Sanitizer -->
  <g>
    <!-- Sanitizer Bottle -->
    <rect x="180" y="340" width="28" height="48" rx="6" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>
    <rect x="189" y="328" width="10" height="12" fill="#0284C7"/>
    <path d="M 194 328 Q 194 320 206 324" stroke="#0284C7" stroke-width="3" fill="none"/>
    <text x="194" y="368" font-size="8" font-family="sans-serif" font-weight="bold" fill="#0369A1" text-anchor="middle">손소독</text>
    <!-- Desk Telephone -->
    <rect x="220" y="345" width="45" height="40" rx="4" fill="#334155"/>
    <rect x="226" y="350" width="20" height="14" fill="#94A3B8"/>
    <circle cx="255" cy="355" r="3" fill="#22C55E"/>
    <rect x="225" y="368" width="35" height="12" rx="2" fill="#475569"/>
  </g>

  <!-- Medical Chart Binder Shelf (Between Monitors) -->
  <g>
    <rect x="680" y="320" width="90" height="65" rx="3" fill="#475569" stroke="#334155" stroke-width="2"/>
    <!-- Colored Binders -->
    <rect x="688" y="325" width="14" height="55" rx="2" fill="#EF4444"/>
    <rect x="704" y="325" width="14" height="55" rx="2" fill="#3B82F6"/>
    <rect x="720" y="325" width="14" height="55" rx="2" fill="#10B981"/>
    <rect x="736" y="325" width="14" height="55" rx="2" fill="#F59E0B"/>
    <rect x="752" y="325" width="14" height="55" rx="2" fill="#8B5CF6"/>
  </g>

  <!-- Pen Holder & Stethoscope (Center Desk) -->
  <g>
    <rect x="620" y="348" width="24" height="34" rx="4" fill="#0284C7"/>
    <line x1="626" y1="334" x2="628" y2="348" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
    <line x1="632" y1="330" x2="632" y2="348" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
    <line x1="638" y1="336" x2="636" y2="348" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- ======================================================== -->
  <!-- TARGET 1: CENTER WORKSTATION MONITOR (x: 35%, y: 42%)    -->
  <!-- In 1200x800: x=420, y=336                                 -->
  <!-- ======================================================== -->
  <g id="workstation-center">
    <!-- Monitor Stand -->
    <rect x="405" y="360" width="30" height="25" fill="#334155"/>
    <polygon points="390,385 450,385 440,378 400,378" fill="#1E293B"/>

    <!-- Monitor Frame -->
    <rect x="300" y="240" width="240" height="150" rx="8" fill="#0F172A" stroke="#334155" stroke-width="3"/>
    <!-- Web Camera on top -->
    <circle cx="420" cy="245" r="3" fill="#475569"/>

    ${isRisk ? `
      <!-- RISK 1: PATIENT EMR SCREEN EXPOSED -->
      <g id="risk-1-exposed-patient-screen">
        <!-- Bright White/Blue Screen showing Medical Chart -->
        <rect x="308" y="248" width="224" height="134" rx="4" fill="#FFFFFF"/>
        <!-- Top Banner: EMR SYSTEM -->
        <rect x="308" y="248" width="224" height="24" fill="#1D4ED8"/>
        <text x="314" y="264" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="11" fill="#FFFFFF">전자의무기록(EMR) - 환자조회</text>
        <rect x="496" y="253" width="30" height="14" rx="2" fill="#DC2626"/>
        <text x="511" y="263" font-family="sans-serif" font-weight="bold" font-size="9" fill="#FFFFFF" text-anchor="middle">노출경고</text>

        <!-- Patient Details Area -->
        <rect x="314" y="276" width="212" height="42" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
        <text x="320" y="290" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="12" fill="#DC2626">환자명: 홍길동 (남, 58세)</text>
        <text x="320" y="304" font-family="'Pretendard', sans-serif" font-size="10" fill="#1E293B">주민번호: 680412-1054321</text>
        <text x="320" y="315" font-family="'Pretendard', sans-serif" font-size="9" fill="#2563EB">병실: 302호 | 진단: 당뇨/만성신부전</text>

        <!-- Prescription / Treatment list -->
        <rect x="314" y="322" width="212" height="52" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
        <text x="320" y="334" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="9" fill="#475569">[처방 및 투약 기록]</text>
        <text x="320" y="347" font-family="'Pretendard', sans-serif" font-size="8.5" fill="#334155">인슐린 10단위 SC 투여 (13:00)</text>
        <text x="320" y="359" font-family="'Pretendard', sans-serif" font-size="8.5" fill="#334155">혈압 145/95 mmHg, 주의관찰</text>
        <text x="320" y="370" font-family="'Pretendard', sans-serif" font-size="8.5" fill="#64748B">담당의: 김내과 전문의 / 담당간호사 서명</text>
      </g>
    ` : `
      <!-- NORMAL 1: SECURE LOCKED SCREEN -->
      <g id="normal-1-locked-screen">
        <rect x="308" y="248" width="224" height="134" rx="4" fill="url(#screenGlass)"/>
        <!-- Hospital Med-Portal Lock Screen -->
        <circle cx="420" cy="285" r="16" fill="#1E3A8A" stroke="#38BDF8" stroke-width="2"/>
        <!-- Padlock icon -->
        <rect x="414" y="284" width="12" height="10" rx="2" fill="#38BDF8"/>
        <path d="M 416 284 V 279 A 4 4 0 0 1 424 279 V 284" stroke="#38BDF8" stroke-width="2" fill="none"/>
        <text x="420" y="318" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="13" fill="#E2E8F0" text-anchor="middle">화면 잠금 상태 (Locked)</text>
        <text x="420" y="334" font-family="'Pretendard', sans-serif" font-size="10" fill="#94A3B8" text-anchor="middle">보안을 위해 화면이 안전하게 잠겼습니다</text>
        <rect x="370" y="345" width="100" height="18" rx="3" fill="#334155" stroke="#475569"/>
        <text x="420" y="358" font-family="sans-serif" font-size="10" fill="#CBD5E1" text-anchor="middle">••••••••••</text>
      </g>
    `}

    <!-- Keyboard & Mouse on counter top -->
    <polygon points="340,388 500,388 490,402 350,402" fill="#334155" stroke="#475569"/>
    <ellipse cx="525" cy="395" rx="10" ry="6" fill="#334155"/>
  </g>

  <!-- ======================================================== -->
  <!-- TARGET 3: OFFICE CHAIR (x: 52%, y: 66%)                   -->
  <!-- In 1200x800: x=624, y=528                                 -->
  <!-- ======================================================== -->
  <g id="chair-area" filter="url(#softShadow)">
    <!-- Chair Base & Wheels -->
    <ellipse cx="624" cy="620" rx="45" ry="14" fill="#0F172A" opacity="0.4"/>
    <rect x="620" y="550" width="8" height="60" fill="#64748B"/>
    <!-- Chair Seat Cushion -->
    <path d="M 580 540 Q 624 530 668 540 L 664 560 Q 624 555 584 560 Z" fill="#1E293B"/>
    <!-- Chair Backrest -->
    <rect x="590" y="450" width="68" height="85" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <!-- Mesh pattern on backrest -->
    <rect x="596" y="456" width="56" height="73" rx="8" fill="#1E293B"/>
    <!-- Armrests -->
    <path d="M 575 510 L 575 535 L 590 535" stroke="#475569" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 673 510 L 673 535 L 658 535" stroke="#475569" stroke-width="5" fill="none" stroke-linecap="round"/>

    ${isRisk ? `
      <!-- RISK 3: EXPOSED EMPLOYEE STAFF ID BADGE -->
      <g id="risk-3-exposed-id-badge">
        <!-- Lanyard hanging from chair corner -->
        <path d="M 618 460 Q 600 500 620 528" stroke="#2563EB" stroke-width="4" fill="none"/>
        <path d="M 622 460 Q 608 502 624 528" stroke="#1D4ED8" stroke-width="3" fill="none"/>
        <!-- ID Badge Card -->
        <g transform="rotate(-6 624 528)">
          <rect x="608" y="512" width="38" height="54" rx="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="2" filter="url(#softShadow)"/>
          <!-- Top clip & color band -->
          <rect x="618" y="508" width="18" height="5" rx="2" fill="#64748B"/>
          <rect x="608" y="512" width="38" height="10" fill="#2563EB"/>
          <text x="627" y="520" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6" fill="#FFFFFF" text-anchor="middle">병원 출입증</text>
          <!-- Staff Photo Box -->
          <rect x="612" y="525" width="14" height="16" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>
          <circle cx="619" cy="531" r="4" fill="#3B82F6"/>
          <path d="M 614 539 A 5 5 0 0 1 624 539 Z" fill="#3B82F6"/>
          <!-- Staff Name & Barcode -->
          <text x="630" y="530" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6.5" fill="#0F172A">간호사</text>
          <text x="630" y="538" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6" fill="#1E40AF">김서연</text>
          <text x="630" y="545" font-family="monospace" font-size="5" fill="#64748B">ID: 2408</text>
          <!-- Barcode lines -->
          <rect x="612" y="552" width="30" height="8" fill="#F1F5F9"/>
          <line x1="615" y1="554" x2="615" y2="558" stroke="#000" stroke-width="1"/>
          <line x1="618" y1="554" x2="618" y2="558" stroke="#000" stroke-width="1.5"/>
          <line x1="622" y1="554" x2="622" y2="558" stroke="#000" stroke-width="1"/>
          <line x1="626" y1="554" x2="626" y2="558" stroke="#000" stroke-width="2"/>
          <line x1="631" y1="554" x2="631" y2="558" stroke="#000" stroke-width="1"/>
          <line x1="635" y1="554" x2="635" y2="558" stroke="#000" stroke-width="1.5"/>
          <line x1="639" y1="554" x2="639" y2="558" stroke="#000" stroke-width="1"/>
        </g>
      </g>
    ` : `
      <!-- NORMAL 3: CLEAN CHAIR - NO BADGE -->
    `}
  </g>

  <!-- ======================================================== -->
  <!-- TARGET 4: RIGHT WORKSTATION & PASSWORD MEMO              -->
  <!-- In 1200x800: x=1032, y=528 (x: 86%, y: 66%)              -->
  <!-- Right Monitor: Center around x=980~1040, y=360~500        -->
  <!-- ======================================================== -->
  <g id="workstation-right">
    <!-- Monitor Stand -->
    <rect x="990" y="440" width="24" height="25" fill="#334155"/>
    <polygon points="975,465 1025,465 1020,460 980,460" fill="#1E293B"/>

    <!-- Right Monitor Frame (Slightly angled) -->
    <rect x="880" y="320" width="200" height="130" rx="6" fill="#0F172A" stroke="#334155" stroke-width="3"/>
    <!-- Screen -->
    <rect x="888" y="328" width="184" height="114" rx="4" fill="url(#screenGlass)"/>
    <!-- Medical Station Screen Content -->
    <rect x="894" y="334" width="172" height="16" fill="#1E3A8A"/>
    <text x="900" y="346" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="9" fill="#FFFFFF">병동 모니터링 시스템 (Vitals)</text>
    <polyline points="900,380 920,380 930,360 940,400 950,380 980,380 990,365 1000,395 1010,380 1050,380" fill="none" stroke="#22C55E" stroke-width="2"/>
    <text x="900" y="420" font-family="monospace" font-size="11" fill="#38BDF8">HR: 76 bpm  SpO2: 99%</text>

    <!-- Desk top under right monitor -->
    <polygon points="900,465 1060,465 1050,485 910,485" fill="#334155"/>

    ${isRisk ? `
      <!-- RISK 4: PASSWORD STICKY NOTE EXPOSED (x: 86% -> 1032, y: 66% -> 528) -->
      <g id="risk-4-password-sticky-memo" transform="translate(10, 0)">
        <!-- Bright Yellow Sticky Note at bottom corner of monitor / desk edge -->
        <g transform="rotate(-4 1024 515)">
          <!-- Note Shadow -->
          <rect x="1004" y="490" width="62" height="62" rx="2" fill="#CA8A04" opacity="0.4"/>
          <!-- Note Body -->
          <rect x="1000" y="486" width="62" height="62" rx="2" fill="#FEF08A" stroke="#FACC15" stroke-width="1.5" filter="url(#softShadow)"/>
          <!-- Top tape / adhesive strip -->
          <rect x="1010" y="484" width="42" height="6" fill="#FDE047" opacity="0.8"/>
          <!-- Red Alert Header -->
          <text x="1031" y="499" font-family="'Pretendard', sans-serif" font-weight="900" font-size="7.5" fill="#DC2626" text-anchor="middle">[원내 통합계정]</text>
          <!-- Password info text -->
          <text x="1006" y="512" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="8" fill="#0F172A">ID: admin</text>
          <text x="1006" y="525" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="8" fill="#B91C1C">PW: nurse1234!</text>
          <line x1="1006" y1="531" x2="1056" y2="531" stroke="#EAB308" stroke-width="0.8"/>
          <text x="1006" y="541" font-family="'Pretendard', sans-serif" font-size="6.5" fill="#854D0E">비번 절대 분실금지!</text>
        </g>
      </g>
    ` : `
      <!-- NORMAL 4: CLEAN MONITOR BEZEL & DESK PAD - NO STICKY NOTE -->
      <g id="normal-4-clean-memo">
        <rect x="1010" y="495" width="40" height="25" rx="3" fill="#E2E8F0" stroke="#CBD5E1"/>
        <text x="1030" y="511" font-family="'Pretendard', sans-serif" font-size="7" fill="#64748B" text-anchor="middle">메모지 보관함</text>
      </g>
    `}
  </g>

  <!-- ======================================================== -->
  <!-- TARGET 2: DISCARDED PATIENT DOCUMENTS (x: 9%, y: 78%)    -->
  <!-- In 1200x800: x=108, y=624                                 -->
  <!-- Bottom-Left area                                          -->
  <!-- ======================================================== -->
  <g id="trash-bin-area">
    ${isRisk ? `
      <!-- RISK 2: PATIENT MEDICAL RECORD DISCARDED IN OPEN TRASH CAN -->
      <g id="risk-2-discarded-patient-document">
        <!-- Open Plastic Waste Can -->
        <ellipse cx="108" cy="670" rx="36" ry="12" fill="#0F172A" opacity="0.35"/>
        <path d="M 75 580 L 141 580 L 132 660 L 84 660 Z" fill="#64748B" stroke="#475569" stroke-width="2"/>
        <ellipse cx="108" cy="580" rx="33" ry="10" fill="#334155"/>
        <text x="108" y="630" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="9" fill="#E2E8F0" text-anchor="middle">일반 쓰레기</text>

        <!-- Crumpled Patient Documents sticking out and falling over -->
        <!-- Document 1: Main medical record chart sticking out -->
        <g transform="rotate(-12 108 580)">
          <rect x="90" y="530" width="48" height="64" rx="2" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" filter="url(#softShadow)"/>
          <!-- Red Confidential stamp -->
          <rect x="96" y="536" width="36" height="12" rx="2" fill="#FEE2E2" stroke="#EF4444" stroke-width="1"/>
          <text x="114" y="545" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="7" fill="#DC2626" text-anchor="middle">진료기록부 (대외비)</text>
          <!-- Patient personal info lines -->
          <text x="94" y="556" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6" fill="#1E293B">성명: 박영희 (여, 62세)</text>
          <text x="94" y="565" font-family="'Pretendard', sans-serif" font-size="5.5" fill="#475569">주민번호: 641103-2******</text>
          <text x="94" y="574" font-family="'Pretendard', sans-serif" font-size="5" fill="#64748B">혈액형: B+ / 수술동의서</text>
          <!-- Corner fold -->
          <polygon points="126,530 138,530 138,542" fill="#E2E8F0"/>
        </g>

        <!-- Document 2: Prescription sheet crumpled on edge -->
        <g transform="rotate(22 135 600)">
          <rect x="120" y="565" width="34" height="42" rx="2" fill="#FEF3C7" stroke="#D97706" stroke-width="1"/>
          <text x="137" y="577" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6" fill="#B45309" text-anchor="middle">처방의뢰서</text>
          <line x1="125" y1="583" x2="148" y2="583" stroke="#D97706" stroke-width="1"/>
          <line x1="125" y1="589" x2="145" y2="589" stroke="#D97706" stroke-width="1"/>
          <line x1="125" y1="595" x2="148" y2="595" stroke="#D97706" stroke-width="1"/>
        </g>
      </g>
    ` : `
      <!-- NORMAL 2: SECURE SHREDDER / LOCKED PAPER DISPOSAL BOX -->
      <g id="normal-2-secure-shredder">
        <ellipse cx="108" cy="670" rx="36" ry="12" fill="#0F172A" opacity="0.35"/>
        <!-- Secure Shredder Box -->
        <rect x="74" y="570" width="68" height="95" rx="4" fill="#334155" stroke="#1E293B" stroke-width="2"/>
        <!-- Top slot with blue lock -->
        <rect x="70" y="565" width="76" height="15" rx="3" fill="#0F172A"/>
        <rect x="88" y="571" width="40" height="3" rx="1" fill="#64748B"/>
        <!-- Security Seal / Lock indicator -->
        <rect x="85" y="590" width="46" height="32" rx="3" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
        <circle cx="108" cy="602" r="5" fill="#0284C7"/>
        <path d="M 106 602 V 599 A 2 2 0 0 1 110 599 V 602" stroke="#FFFFFF" stroke-width="1.5" fill="none"/>
        <text x="108" y="616" font-family="'Pretendard', sans-serif" font-weight="bold" font-size="6" fill="#38BDF8" text-anchor="middle">보안문서 세단기</text>
        <text x="108" y="642" font-family="'Pretendard', sans-serif" font-size="7" fill="#94A3B8" text-anchor="middle">규정파기 완료</text>
      </g>
    `}
  </g>

  <!-- Foreground subtle ambient lighting -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#0284C7" opacity="0.02" pointer-events="none"/>
</svg>
`;
}

async function run() {
  const outDir = path.resolve(process.cwd(), 'public/images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const normalSVG = createBaseSVG(false);
  const riskSVG = createBaseSVG(true);

  console.log('Rendering normal image...');
  await sharp(Buffer.from(normalSVG))
    .png()
    .toFile(path.join(outDir, 'security-normal.png'));

  console.log('Rendering risk image...');
  await sharp(Buffer.from(riskSVG))
    .png()
    .toFile(path.join(outDir, 'security-risk.png'));

  console.log('Successfully generated:');
  console.log(' - public/images/security-normal.png');
  console.log(' - public/images/security-risk.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
