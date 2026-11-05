# 포트폴리오 디자인·구현 기준

현재 소스 기준: 2026-11-05.

## 페이지 구성

메인은 Intro → Web Projects → AI VIDEO → Event Page → Skill → Q&A → Contact 순서다. Web Projects는 NEW ERA와 TOUS les JOURS의 실제 사이트로 연결한다. AI VIDEO는 PAWLY, SIPON, 새콤달콤의 미리보기와 재생 장면으로 구성한다. Event Page는 라카·카밀·티젠 상세 페이지 3개로 연결한다.

현재 제공하는 HTML은 `index.html`, `pages/event-laka.html`, `pages/event-kamill.html`, `pages/event-kombucha.html`이다.

## 스타일

- 검정·흰색·페이퍼 배경, 얇은 구획선, 넓은 여백, 큰 영문 타이포를 사용한다. 작품 이미지가 브랜드 색상을 담당한다.
- 산세리프 본문과 세리프 이탤릭 제목으로 대비를 만든다. 폰트·색상·크기·반응형 값은 `portfolio-tokens.css`를 기준으로 한다.
- 메인 CSS 순서는 `portfolio-tokens.css` → `style.css` → `student.css` → `reference-alignment.css` → `project-categories.css` → `shortform.css` → `personal-projects.css` → `event-pages.css` → `portfolio.css`다.
- 상세 페이지는 `portfolio-tokens.css`와 `pages/event-page.css`를 사용한다.
- 맥북 영상은 `object-fit: contain`으로 전체 화면을 유지한다. 상세 디자인 이미지의 원본 비율을 유지한다.
- 반응형 검수 폭은 390·768·1024·1440px이다. 가로 넘침, 본문 읽기, 버튼 접근을 확인한다.

## 인터랙션

- `script.js`: 메뉴·내비게이션·스크롤 전환·AI 영상 장면·Skill 캐러셀·Q&A·맨 위로 이동.
- `portfolio.js`: 메뉴 접근성 상태·Escape 닫기·Q&A 연결·히어로 모션 토큰.
- `project-video.js`: 프로젝트 영상 노출에 따른 재생·정지, 제목 크기와 섹션 간격 보정.
- `ai-video.js`: AI 영상 제어와 미리보기에서 해당 영상으로 이동.
- 모션은 CSS, Canvas, IntersectionObserver와 requestAnimationFrame을 사용한다. 모바일 메뉴는 닫힌 동안 키보드 접근을 막고, Escape로 닫힌 뒤 버튼에 포커스를 돌린다.
- Q&A는 `aria-expanded`, `aria-controls`와 답변 표시 상태를 일치시킨다. 모션 감소 설정에서는 히어로 애니메이션을 정지한다.

## 자산·배포

- 사용 중인 자산은 `images/`, `fonts/`, `files/`에 둔다. 로컬 검수 화면과 제작 중 캡처는 `.local-preview/`에 저장한다.
- `images/event-pages/design-sources.json`은 원본 디자인 출처 기록이다. `reference-assets.json`은 현재 남아 있는 다운로드 파일 기록이다.
- 빌드는 현재 페이지와 CSS·JS·이미지·폰트·PDF를 `dist/`에 복사한다. 검수 문서와 제작 메타데이터는 배포하지 않는다.
- `npm run build`는 HTML 구조, CSS 자산, 연결된 파일의 누락과 미사용 파일을 검사한다.

## 브라우저 검수

로컬 서버 실행 후 `node tools/full-page-check.mjs`를 실행한다. 전체 페이지를 네 가지 폭에서 열고 이미지·내부 링크·앵커·중복 ID·가로 넘침·메뉴·Q&A·영상 재생·내비게이션·모션 감소·JS 예외·HTTP 오류를 검사한다.

결과는 `.local-preview/full-page-report.json`, 캡처는 `.local-preview/full-*.png`에 저장한다. 실제 기기와 Safari는 별도 검수 범위다.
