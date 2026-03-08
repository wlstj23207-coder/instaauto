# Insta Auto

인스타그램 콘텐츠 자동화 웹앱 + Electron 데스크톱 앱입니다.

## 1) 로컬 웹 실행

```bash
npm install
npm run dev
```

## 2) Electron 실행

```bash
npm run electron:dev
```

프로덕션 빌드 기준 실행:

```bash
npm run electron:start
```

## 3) Electron 설치파일(dmg) 빌드

```bash
npm run electron:dist
```

## 4) Vercel 배포

1. Vercel 프로젝트에 환경변수 설정
- `ANTHROPIC_API_KEY`
- (선택) `ANTHROPIC_MODEL`

2. 배포

```bash
vercel deploy -y
```

## API

- `POST /api/claude`
- Body: `{ "systemPrompt": "...", "userMessage": "..." }`
