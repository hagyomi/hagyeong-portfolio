# Unused asset cleanup

Date: 2026-11-05

## 최종 정리·검수

- 두 차례 정리 합계: 파일 90개 삭제, 약 57.55MiB 제거.
- 별도로 로컬 임시 Chrome 프로필 폴더 55개(약 5.16GiB)를 정리했습니다. 최종 검사 결과와 화면 캡처는 유지했습니다.
- 메인과 연결되지 않은 데모 페이지 5개, 전용 공통 파일, 이전 이미지·영상 및 검수 도구 2개를 제거했습니다.
- 삭제된 영역의 JS·이벤트 리스너·상태 변수·설명 주석과 미사용 CSS 선택자 1,155개를 정리했습니다. 푸터는 현재 사용하는 정적 Canvas만 유지했습니다.
- 숨김 복제 요소와 이전 목업 곡선을 제거했고, 해당 요소의 삭제로 달라지던 모바일 여백을 기존 화면과 같게 맞췄습니다.
- 파일 참조 검사: 현재 배포 파일 118개 모두 메인 페이지와 연결, 누락·미연결 파일 0개.
- 메인과 상세 3개 페이지 × 390·768·1024·1440px: 16건 페이지 검사, 주요 구간 56건, 영상 재생 20건, 내부 링크 48건 통과.
- AI 영상 미리보기 이동·포커스·재생 6건, Skill 캐러셀의 휠·키보드 조작, 맨 위로 이동 통과. 메뉴 열기·Escape 닫기·Q&A·내비게이션·모션 감소 설정도 통과했습니다.
- JS 예외·HTTP 오류·이미지 누락·가로 넘침·중복 ID·끊어진 내부 앵커 없음.
- 정리 전후 4개 폭의 스타일 비교: 삭제 대상으로 확정한 숨김 요소 5개를 각 기준 화면에서 제외한 뒤, 남은 요소의 스타일 차이 0개.
- `npm run build` 통과. 검수 문서와 제작 메타데이터는 배포 결과에서 제외했습니다.
- 디자인 지침·다운로드 기록·캡처 도구·검수 도구를 현재 페이지 구성에 맞췄습니다.

검수 환경은 로컬 Chrome입니다. 외부 사이트의 내부 기능, 실제 모바일 기기와 Safari는 포함하지 않습니다.

결과: `.local-preview/full-page-report.json`, `.local-preview/interaction-report.json`, `.local-preview/css-structure-differences.json`. 화면 캡처: `.local-preview/full-*.png`.

추가 제거한 이전 구조 전용 도구: `tools/personal-check.mjs`, `tools/project-video-check.mjs`.

## 1차 정리 기록

Removed 64 files (45.22 MiB) with no runtime consumers. Checked all HTML, CSS and JavaScript, including dynamically assembled gallery paths. Removed the retired Diptyque lightbox and superseded hero motion script. The download manifest was subsequently updated to include only remaining files.

Empty folders removed: images\shortform, images\zara-methodology\images\zara-methodology, images\zara-methodology\images, images\zara-methodology, vendor\images

## Removed files

- `diptyque-process.css`
- `diptyque-process.js`
- `hero-motion.js`
- `images/after-effects.svg`
- `images/claude.svg`
- `images/dreamina-logo.png`
- `images/event-pages/kamill.png`
- `images/event-pages/laka.png`
- `images/icon-arrow-up-right.svg`
- `images/newera/attitude.png`
- `images/newera/categories.png`
- `images/newera/collaboration.png`
- `images/newera/history.png`
- `images/newera/lookbook.png`
- `images/newera/silhouette.png`
- `images/onda-desktop-recording.webm`
- `images/onda-desktop.png`
- `images/onda-mobile.png`
- `images/onda-tablet.png`
- `images/onda-tea.png`
- `images/personal-gallery/luma-screen.png`
- `images/practice-1-desktop.png`
- `images/practice-2-desktop.png`
- `images/practice-3-desktop.png`
- `images/ready-meeting-generated.png`
- `images/ready-presentation-generated.png`
- `images/ready-work-generated.png`
- `images/shortform/hero-poster.png`
- `images/shortform/hero.webm`
- `images/shortform/night-poster.png`
- `images/shortform/night.webm`
- `images/shortform/quiet-poster.png`
- `images/shortform/quiet.webm`
- `images/touslesjours/menu.png`
- `images/work-retention-ipad-bezel.webp`
- `images/work-typo-imac27.webp`
- `images/zara-desktop.png`
- `images/zara-methodology/3c.png`
- `images/zara-methodology/affinity.png`
- `images/zara-methodology/brand.png`
- `images/zara-methodology/competitors.png`
- `images/zara-methodology/components.png`
- `images/zara-methodology/interviews.png`
- `images/zara-methodology/journey.png`
- `images/zara-methodology/lean.png`
- `images/zara-methodology/meeting.png`
- `images/zara-methodology/mindmap.png`
- `images/zara-methodology/moodboard.png`
- `images/zara-methodology/persona.png`
- `images/zara-methodology/questions.png`
- `images/zara-methodology/requirements.png`
- `images/zara-methodology/sitemap.png`
- `images/zara-methodology/steep.png`
- `images/zara-methodology/summary.png`
- `images/zara-methodology/system.png`
- `images/zara-methodology/wireframe.png`
- `images/zara-mobile.png`
- `images/zara-recording-poster.png`
- `images/zara-site-recording.webm`
- `images/zara-tablet.png`
- `images/zara-team-meeting-generated.png`
- `images/zara-team-work-generated.png`
- `images/zara-methodology/flow.png`
- `images/zara-methodology/sources.json`

## Follow-up cleanup

Removed unreachable legacy demo pages and their exclusive shared assets:

- `pages/clone-01.html`
- `pages/clone-02.html`
- `pages/clone-03.html`
- `pages/personal-02.html`
- `pages/personal-luma.html`
- `pages/page.css`
- `pages/page-tokens.css`
- `pages/page.js`
- `pages/page-motion.js`
- `photo-ratio.js`
- `assets/editorial-sheet.png`
- `vendor/gsap.min.js`

Additional assets left unused after removing legacy code:

- `images/computer-work-generated.png`
- `images/elan-desktop.png`
- `images/elan-mobile.png`
- `images/elan-perfume.png`
- `images/newera/desktop.png`
- `images/office-work.png`
- `images/personal-gallery/luma.png`
- `images/team-meeting-generated.png`
- `images/touslesjours/desktop.png`
- `images/touslesjours/mobile.png`
- `images/touslesjours/story.png`
- `images/work-ilkw-ipad-screen.webp`
