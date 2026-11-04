# 03 Event Page

기존 클론 코딩 소개와 NORTH·FORM·MODE 카드를 제거하고 라카·카밀·티젠 콤부차 이벤트 디자인을 소개합니다. 메뉴 앵커 `#practice`는 기존 연결을 유지합니다.

## 원본과 구성

| 작품 | Figma 노드 | 소개 |
| --- | --- | --- |
| Laka | 363:787 | 모델·제형 비주얼, 볼륨과 보습, 베스트 틴트, 컬러 가이드, 제품 특징 |
| Kamill | 272:699 | 캐모마일과 핸드케어, 성분·향별 라인업, CARE DAYS 할인·증정·세트 혜택 |
| TEAZEN 콤부차 | 69:186 | 이벤트 할인, 첫 구매·친구 추천, 랜덤 쿠폰, 보틀 증정과 안내 |

Figma 파일: `VgDn8TpEInUTj3PxseLwwY`.

작품 소개는 실제 디자인의 구성·색상·시각적 특징을 기준으로 작성했습니다. 작업 기간·기여율·개발 기술은 확인되지 않아 추가하지 않았습니다. 포트폴리오에서는 디자인 작품으로 소개하며, 실제 구매나 쿠폰 발급 기능이 있는 사이트로 표시하지 않습니다.

## 이미지 품질

Figma `download_assets`의 전체 내보내기는 긴 페이지를 4096px 높이로 축소해 라카는 350px, 카밀은 167px 폭이 되었습니다. 상세 화면에서는 이 축소본 대신 원본 직계 섹션 40개를 각각 내보내 원래 좌표·크기·겹침 순서에 배치했습니다. 모든 이미지와 위치는 `images/event-pages/design-sources.json`에 기록했습니다.

라카 아트보드는 1200×14048, 카밀은 1200×29446입니다. 콤부차는 전체 내보내기 1070×3318을 사용합니다. 메인 미리보기의 상단 크롭과 달리 상세 화면은 전체 디자인을 스크롤해 볼 수 있습니다. 임시 Figma 이미지 URL을 배포 코드에 사용하지 않습니다.

## 파일

- 메인 영역: `index.html`, `event-pages.css`
- 상세: `pages/event-laka.html`, `pages/event-kamill.html`, `pages/event-kombucha.html`
- 상세 스타일: `pages/event-page.css`
- 원본 디자인과 섹션 이미지: `images/event-pages/`
- 검수: `node tools/event-pages-check.mjs` (로컬 서버 실행 필요)
