# 개인 프로젝트 구성

기존 02 개인 프로젝트의 맥북 목업 · OVERVIEW · WEBSITE 버튼 형식으로 구성합니다.
기존 팀 프로젝트의 상세 화면, 협업 역할 소개, 자라 방법론은 제거했습니다.

## 순서

- 개인 프로젝트 개요
- NEW ERA: https://hagyomi.github.io/newear/
- TOUS les JOURS: https://hagyomi.github.io/Touslesjours/

ONDA와 LUMA 항목은 제거했습니다.
스크롤은 개요 1개와 작업물 2개에 맞춰 조정했습니다. 유형 번호는 개인 프로젝트, AI VIDEO, Event Page의 3개입니다.

## 실제 사이트 확인 내용

뉴에라는 폴라로이드 히어로, 브랜드 연혁, 6종 실루엣 가이드, 컬래버레이션, FW26 RIIZE 소희 룩북을 연결한 메인 페이지입니다. 공개 배포 소스에서 React와 GSAP · ScrollTrigger 구현을 확인했습니다.

뚜레쥬르는 베이커리 비주얼과 손그림 요소를 활용하고 메뉴, 계절 선물, Daily Pick’s, 이벤트, 브랜드 이야기, 매장 안내를 연결합니다. 공개 배포 소스에서 React, 제품 탐색과 상세 오버레이, GSAP 기반 스크롤 모션을 확인했습니다. 테스트 로그인은 실제 회원 인증과 구분됩니다.

확인되지 않은 작업 기간과 기여율은 기재하지 않습니다. 맥북 화면은 실제 사이트를 스크롤해 녹화한 WebM 영상을 무음 반복 재생합니다. 캡처 이미지는 포스터와 장식 카드에 사용합니다.

## 레퍼런스 영상과 목업 보정

`https://persona1-pi.vercel.app/`의 실제 HTML·보정 CSS와 ONDA 영상 파일을 확인했습니다. ONDA 영상은 1280×804, 25fps, 16.4초입니다. `preload="none"`, 포스터, 무음·반복·인라인 재생, 장면 진입 시 재생 구조를 유지합니다.

기존 화면 박스는 `top: -3.8%`, `height: 111.2%`로 확대되어 있었습니다. 이 보정을 제거하고 맥북 이미지의 실제 화면 구멍(3450×2164) 비율을 사용합니다. 영상은 `object-fit: contain`으로 전체 화면을 보존하며 확대·음수 오프셋을 적용하지 않습니다.

영상은 1600×1004 PNG 원본 프레임을 25fps 고정 프레임 간격으로 인코딩합니다. VP9 CRF 20을 적용해 기존 JPEG 화면 재압축과 실시간 캡처 프레임 누락을 줄입니다. 스크롤 위치를 프레임별로 직접 계산하며 뉴에라는 360px/s, 뚜레쥬르는 320px/s입니다. 시작과 끝에 각각 2초 정지 구간이 있습니다. 녹화 과정에서 브라우저 스크롤바를 숨깁니다.

## 관리

- 스타일: `personal-projects.css`
- 캡처: `images/newera/`, `images/touslesjours/`
- 원본 캡처 도구: `tools/newera-capture.mjs`, `tools/touslesjours-capture.mjs`
- 영상 녹화: `node tools/record-project.mjs newera`, `node tools/record-project.mjs touslesjours`
- 인코딩 도구: `.local-preview/ffmpeg.exe` (로컬 전용, 배포 자산에 포함하지 않음)
- 영상 자산: 각 프로젝트 이미지 폴더의 `site-recording.webm`
- 로컬 검수: 서버 실행 후 `node tools/full-page-check.mjs`
- 결과: `.local-preview/full-page-report.json`과 PC·모바일 캡처
- 영상 재생·프레임 크기·목업 화면 박스 검수: `node tools/project-cover-check.mjs`
