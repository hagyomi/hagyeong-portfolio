# HaGyeong Jung Portfolio

정하경의 Web Projects · AI Video · Event Page 포트폴리오입니다.

## 로컬 실행

Node.js 20 이상에서 별도 패키지 설치 없이 실행합니다.

```sh
npm run dev
```

주소: http://127.0.0.1:4173

## 빌드 및 배포

```sh
npm run build
```

HTML 구조·에셋 검사를 통과한 뒤 배포용 파일을 `dist/`에 생성합니다. 원본 소스와 로컬 검수 결과는 배포 출력에 포함하지 않습니다.

Vercel 설정은 `vercel.json`에 보관합니다.

- Framework: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: 없음 (런타임 외부 의존성 없음)
- Git 자동 배포: 활성화
- Production Branch: 연결된 Vercel 프로젝트에서 `main`으로 설정

GitHub 저장소를 Vercel 프로젝트에 연결하면 `main` push는 운영 배포, 다른 브랜치 push는 미리보기 배포가 됩니다. 저장소 업로드와 Vercel 계정의 Git 연결은 별도 단계입니다.

## 주요 파일

- `index.html`: Intro → Work → Skill → Q&A → Contact
- `portfolio-tokens.css`: 폰트·색상·크기·반응형 토큰
- `portfolio.css`: 토큰과 컴포넌트 연결, 공통 접근성 스타일
- `style.css`, `student.css`, `reference-alignment.css`: 기본 레이아웃과 스크롤 장면
- `personal-projects.css`, `shortform.css`, `event-pages.css`: 작업 유형별 화면
- `script.js`, `portfolio.js`, `project-video.js`, `ai-video.js`: 동작과 영상 제어
- `images/`, `fonts/`, `files/`: 작품·서체·이력서 자산
- `pages/event-*.html`: 라카·카밀·티젠 상세 디자인
- `tools/`: 로컬 서버·검수·정적 빌드
- `design-guideline.md`: 디자인 적용 기준
- `files/css-structure-audit.md`: 구조·CSS 검수 기록

## 검수

```sh
node tools/check-structure.mjs
node tools/check-assets.mjs
```

Chrome 검수 도구는 로컬 서버와 Chrome 설치가 필요합니다.

```sh
node tools/guideline-check.mjs
```

`.local-preview/`, `dist/`, `.vercel/`, 환경변수 파일은 Git에 포함하지 않습니다.
