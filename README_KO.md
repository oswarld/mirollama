<p align="center">
  <img src="static/image/mirollama.png" width="480" alt="mirollama" />
</p>

# mirollama

<p align="center">
  <a href="https://github.com/oswarld/mirollama/stargazers"><img src="https://img.shields.io/github/stars/oswarld/mirollama?style=flat-square&color=yellow" alt="stars" /></a>
  <a href="https://github.com/oswarld/mirollama/watchers"><img src="https://img.shields.io/github/watchers/oswarld/mirollama?style=flat-square&color=blue" alt="watchers" /></a>
  <a href="https://github.com/oswarld/mirollama/network/members"><img src="https://img.shields.io/github/forks/oswarld/mirollama?style=flat-square&color=blue" alt="forks" /></a>
  <img src="https://img.shields.io/badge/Docker-Build-blue?style=flat-square&logo=docker" alt="docker" />
</p>

<p align="center">
  <a href="https://x.com/oswarld_oz"><img src="https://img.shields.io/badge/X-Follow-black?style=flat-square&logo=x" alt="X" /></a>
  <a href="https://linkedin.com/in/oswarld"><img src="https://img.shields.io/badge/LinkedIn-Follow-blue?style=flat-square&logo=linkedin" alt="LinkedIn" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_ZH.md">中文文档</a> | <a href="README_KO.md">한국어 가이드</a>
</p>

**로컬에서 돌아가는 AI 에이전트 시나리오 시뮬레이션 워크벤치.**
mirollama는 업로드한 문서를 시나리오 시뮬레이션으로 바꿔주는 로컬 우선(Local-first) AI 에이전트 워크벤치입니다.
문서를 올리고, 상황을 한 줄로 적으면, 로컬 LLM 기반 에이전트들이 다양한 이해관계자가 어떻게 반응할지를 시뮬레이션합니다.

> mirollama는 챗봇이 아닙니다.
> 시나리오를 돌려보는 실험실(Scenario Lab)입니다.

---

## 라이브 데모

PDF를 미리 박아둔 정적 데모로, Ollama 설치 없이 전체 파이프라인(그래프 구축 → 페르소나 → 시뮬레이션 → 리포트) 흐름을 둘러볼 수 있습니다. 언어별로 시나리오와 페르소나가 다릅니다.

- 🇰🇷 **한국어** — 2026 지방소멸대응기금: [https://mirollama-local-fund-demo.vercel.app/live-demo/ko](https://mirollama-local-fund-demo.vercel.app/live-demo/ko)
- 🇺🇸 **English** — FAA AI 인증 연구계획: [https://mirollama-local-fund-demo.vercel.app/live-demo/en](https://mirollama-local-fund-demo.vercel.app/live-demo/en)
- 🇨🇳 **中文** — 第一次债권자회의 공고: [https://mirollama-local-fund-demo.vercel.app/live-demo/zh](https://mirollama-local-fund-demo.vercel.app/live-demo/zh)

데모는 의도적으로 정적입니다. 실제 문서를 올려서 진짜 다중 에이전트 시뮬레이션을 돌려보려면 아래 로컬 셋업을 따라주세요.

---

## 5분 안에 로컬에서 실행하기

```bash
# 1. Ollama 설치 후 최소 스펙 모델 다운로드 (~19GB)
ollama pull gemma4:31b
ollama serve   # http://localhost:11434/v1 에 OpenAI 호환 API가 뜹니다

# 2. 저장소 클론 & 설정
git clone https://github.com/oswarld/mirollama.git
cd mirollama
cp .env.example .env

# 3. 의존성 설치 (root + frontend + backend)
npm run setup:all

# 4. 프론트엔드 + 백엔드 동시 실행
npm run dev
```

`http://localhost:3000` 에서 UI를 열고, `http://localhost:5001/health` 로 백엔드 상태를 확인하세요.

> mirollama는 **`gemma4:31b` 를 최소 기준 모델**로 설계됐습니다. 7B–20B 같은 더 작은 모델도 돌아가긴 하지만 온톨로지 추출과 페르소나 행동의 품질이 눈에 띄게 떨어집니다. 최소 스펙에 필요한 하드웨어는 아래 [시스템 요구사항](#시스템-요구사항)을 참조하세요.

---

## 저장소 구조
- `backend/` — Python(Flask) 백엔드, `uv`로 실행
- `frontend/` — 메인 웹 UI (Vue 3 + Vite)
- `local-fund-demo/` — 위 라이브 데모로 배포되는 정적 Next.js 콘솔
- `persona-dashboard/` — 보조 UI 도구 (선택)

---

## mirollama가 풀려는 문제

대부분의 AI 도구는 **하나의 질문에 하나의 답**을 줍니다.
mirollama는 **"이런 상황에서 사람들이 어떻게 반응할까"** 를 시뮬레이션합니다.

쓸 수 있는 질문 예시:
- 새 제품을 출시하면 고객·경쟁사·미디어가 어떻게 반응할까?
- 대학이 엄격한 AI 사용 정책을 도입하면 학생·교수·관리자가 어떻게 반응할까?
- 정부의 새 규제에 대해 시민·산업계·언론이 어떻게 반응할까?
- 회사 내부 전략 메모를 다른 팀들이 어떻게 해석할까?
- 시장·정책·사회 이슈에 대한 여론이 시간이 지나면서 어떻게 변할까?

핵심 워크플로우:
```text
문서 + 시나리오
        ↓
온톨로지 생성 (엔티티 / 관계 추출)
        ↓
에이전트 페르소나 생성
        ↓
다중 에이전트 시뮬레이션
        ↓
리포트 & 인사이트
```

---

## 왜 로컬 우선(Local-first)인가

시나리오 시뮬레이션에는 다음과 같은 민감한 정보가 들어가는 경우가 많습니다:
- 내부 문서
- 미공개 전략
- 연구 자료
- 고객 데이터
- 정책 초안
- 개인 메모

mirollama는 기본적으로 **Ollama를 통해 로컬 LLM**으로 동작합니다. 즉:
- 클라우드 LLM API 의무 없음
- 민감 문서가 외부로 나가지 않음
- 인터넷 연결 없이도 실험 가능
- OpenAI 호환 로컬 엔드포인트 지원
- 외부 그래프/검색 도구는 필요할 때 선택적으로 연결

---

## 권장 모델

mirollama는 큼직한 로컬 모델일수록 좋은 결과를 냅니다. 최소 기준은 **`gemma4:31b`** 입니다 — 그보다 작은 모델(7B / 13B / 20B / 26B)도 동작은 하지만 온톨로지·페르소나·다중 에이전트 서사의 품질이 눈에 띄게 얇아집니다.

| 모델 | 언제 쓰나 | 디스크 크기 | 실행 메모리 |
|-------|------|-----|------|
| `gemma4:31b` | **최소 기준 — 여기서 시작** | ~19 GB (q4_K_M) | ~22–24 GB unified / VRAM |
| `gpt-oss:120b` | 고품질, 복잡한 다중 이해관계자 시뮬레이션 | ~70 GB (q4) | ~80 GB unified / VRAM |
| `gpt-oss:20b` | 자원 제약 시 — 동작은 하지만 추론 품질 저하 | ~12 GB | ~14–16 GB |

```bash
# 최소 기준 (시작 권장)
ollama pull gemma4:31b

# 고품질 (워크스테이션·서버급 GPU 필요)
ollama pull gpt-oss:120b
```

기준 미달 모델(`gemma4:26b`, `gpt-oss:20b`, `llama3:8b` 등)은 초기 실험에는 쓸 수 있지만 전체 시뮬레이션 파이프라인에는 공식 지원하지 않습니다.

---

## 시스템 요구사항

아래 최소 스펙은 **`gemma4:31b`** 기준입니다. `gpt-oss:120b` 같은 70B+ 모델은 메모리가 약 4배 더 필요합니다.

### macOS (Apple Silicon)
| | 최소 (gemma4:31b) | 권장 | 메모 |
|---|---|---|---|
| 칩 | M1 Max / M2 Pro / M3 Pro | M2 Max / M3 Max / M4 Pro+ | Metal 추론, CUDA 불필요 |
| 통합 메모리 | **24 GB** | 32 GB+ | 16 GB Mac은 31B 모델을 메모리에 못 올림 |
| 저장공간 | 30 GB 여유 | 멀티 모델이면 100 GB+ | |

### Windows / Linux (NVIDIA)
| | 최소 (gemma4:31b) | 권장 | 메모 |
|---|---|---|---|
| GPU | RTX 3090 / 4090 / A5000 | RTX 6000 Ada / A6000 / 3090 dual | **VRAM 24 GB** 가 31B 실용 한계점 |
| 시스템 RAM | 32 GB | 64 GB+ | 백엔드 + 프론트 + Ollama + 브라우저 |
| CPU | 최신 6코어 | 최신 8코어 | |
| OS | Windows 11 / Ubuntu 22.04+ | 동일 | CUDA 툴킷 설치 |
| 저장공간 | 30 GB 여유 | 100 GB+ | |

### CPU-only / Intel Mac
이론상 64 GB+ RAM이면 가능하지만, `gemma4:31b`는 일반 소비자 CPU에서 1초당 1토큰 미만으로 응답합니다. 오프라인 배치 실험 정도에만 권장.

### 소프트웨어 사전 요구사항
- Node.js 20+ (18도 동작, 20+ 권장)
- Python 3.11+
- [`uv`](https://github.com/astral-sh/uv) (백엔드용 Python 패키지 매니저)
- [Ollama](https://ollama.com) 로컬 실행 중
- 다운로드된 모델 (`gemma4:31b` 최소)

---

## 로컬 셋업 (상세)

### 1. Ollama 설치 + 기준 모델 다운로드
[https://ollama.com](https://ollama.com) 에서 Ollama 설치 후:

```bash
# 19 GB 다운로드 — 디스크와 메모리 여유 확인
ollama pull gemma4:31b

# OpenAI 호환 API를 http://localhost:11434/v1 로 띄움
ollama serve
```

도달 가능 여부 확인:
```bash
curl http://localhost:11434/v1/models
```

### 2. 저장소 클론
```bash
git clone https://github.com/oswarld/mirollama.git
cd mirollama
```

### 3. 환경 설정
```bash
cp .env.example .env
```

최소 로컬 셋업 `.env`:
```dotenv
# Ollama OpenAI 호환 엔드포인트
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_NAME=gemma4:31b

# 로컬 Ollama에는 LLM_API_KEY가 선택사항. 프록시·게이트웨이가
# 토큰을 요구하는 경우에만 주석 해제.
# LLM_API_KEY=ollama

# 검색 제공자
# none: 순수 로컬 (웹 검색 안 함)
# searxng: 자체 호스팅 SearXNG
SEARCH_PROVIDER=none
SEARXNG_BASE_URL=
WEB_SEARCH_LANGUAGE=ko-KR
WEB_SEARCH_LIMIT=10
```

### 4. 의존성 설치
```bash
npm run setup:all   # root + frontend + backend(uv sync)
```

프론트나 백엔드만 따로 설치하려면:
```bash
npm run setup           # root + frontend
npm run setup:backend   # backend (uv sync)
```

### 5. mirollama 실행
```bash
npm run dev
```

- 프론트엔드: `http://localhost:3000`
- 백엔드: `http://localhost:5001`
- Health check: `http://localhost:5001/health`

### 6. 전체 흐름 검증
1. 짧은 PDF나 마크다운 파일을 업로드 영역에 드롭
2. 한 문장짜리 시나리오 입력 (예: *"이 정책이 다음 달 통과되면 시민·기업·언론이 어떻게 반응할지 시뮬레이션"*)
3. 파이프라인 진행 관찰: 온톨로지 → 페르소나 → 시뮬레이션 → 리포트
4. "그래프 구축" 또는 페르소나 생성 단계에서 멈추면 모델이 너무 작거나 메모리가 부족할 가능성 — 더 작은 모델을 쓰고 있다면 `gemma4:31b` 로 올리고, GPU/Metal을 쓰는 다른 앱을 닫아보세요

---

## npm 스크립트
- `npm run setup` — root + frontend 의존성 설치
- `npm run setup:backend` — `uv` 로 백엔드 의존성 설치
- `npm run setup:all` — 전체 의존성 설치
- `npm run dev` — 프론트 + 백엔드 동시 실행
- `npm run backend` — 백엔드만 실행
- `npm run frontend` — 프론트엔드만 실행
- `npm run build` — 프론트엔드 프로덕션 빌드

---

## 동작 방식

1. **문서 업로드** — PDF, 마크다운, 일반 텍스트
   예: 정책 초안 / 시장 보고서 / 제품 브리프 / 연구 노트 / 회의 요약 / 커뮤니티 글 / 뉴스 기사 / 내부 전략 문서

2. **시나리오 기술** — mirollama에게 무엇을 시뮬레이션할지 알려줌
   예: *"대학이 엄격한 AI 정책을 도입했을 때 학생·교수·관리자·언론이 어떻게 반응할지 시뮬레이션"*

3. **온톨로지 생성** — 문서에서 엔티티 타입, 이해관계자 타입, 관계를 자동 추출
   - 엔티티 타입: `Student`, `Professor`, `Administrator`, `Journalist`, `Parent`, `OnlineCommunityMember` ...
   - 관계 타입: `supports`, `criticizes`, `influences`, `reports_on`, `reacts_to` ...

4. **에이전트 프로필 생성** — 추출된 엔티티/이해관계자를 AI 에이전트로 변환
   각 에이전트에 다음이 부여됨: 역할 / 배경 / 동기 / 신념 / 메모리 / 행동 경향

5. **시뮬레이션 실행** — Twitter/Reddit 같은 소셜 미디어 환경에서 에이전트들이 상호작용
   액션: 게시글 / 댓글 / 좋아요·싫어요 / 리포스트 / 팔로우 / 다른 에이전트에 반응 / 시간에 따른 의견 변화

6. **리포트 생성** — 시뮬레이션 결과 요약
   주요 내러티브 / 발생한 갈등 / 이해관계자 반응 / 위험 신호 / 잠재적 기회 / 종합 인사이트

---

## 모드

### 로컬 모드 (기본)
```dotenv
SEARCH_PROVIDER=none
```
- 단순한 셋업
- 외부 그래프 메모리 없음
- 클라우드 의존성 없음
- 사적 문서 기반 시뮬레이션
- **시작점으로 권장**

### SearXNG 모드
```dotenv
SEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://localhost:8080
```
시뮬레이션이 외부 검색 결과를 참고할 수 있음. 상용 검색 API를 피하면서도 외부 정보 통합 가능.

---

## 활용 예시

### 1. 제품 출시 시뮬레이션
**업로드**: 제품 브리프, 고객 리서치, 가격표, 경쟁사 분석
**시나리오**: *예상보다 높은 가격으로 출시될 때 초기 도입자 / 기업 구매자 / 경쟁사 / 인플루언서가 어떻게 반응할지*
**산출물**: 고객 흥미·반대 의견, 가격 민감도, 경쟁 서사, 위험 신호, GTM 인사이트

### 2. 정책 반응 시뮬레이션
**업로드**: 정책 초안, 공공 설문, 뉴스 기사, 이해관계자 발언
**시나리오**: 새 AI 규제에 대한 시민 반응
**산출물**: 지지자 서사, 비판자 우려, 미디어 프레이밍, 온라인 커뮤니티 반응, 정치·사회 위험

### 3. 대학 AI 정책 시뮬레이션
**업로드**: AI 사용 정책, 학생 설문, 교수회 회의록, 학사 무결성 가이드라인
**시나리오**: 엄격한 과제 정책에 대한 학생·교수·조교·관리자 반응
**산출물**: 학생 공정성 우려, 교수진 의견 충돌, 관리자 위험 관리, 미디어 논란 가능성, 커뮤니케이션 전략 제안

### 4. 시장 내러티브 시뮬레이션
**업로드**: 애널리스트 리포트, 회사 발표, 산업 뉴스, 커뮤니티 토론
**시나리오**: 대형 전략 발표에 대한 투자자·애널리스트·개미 트레이더·미디어 반응
**산출물**: 강세·약세 서사, 오해 위험, 정보 격차, 시간에 따른 서사 변화

---

## Docker

Docker Compose 설정 포함:
```bash
docker compose up -d
```
기본 포트: 프론트 `3000`, 백엔드 `5001`. 업로드/생성 산출물은 `./backend/uploads` 에 마운트.

> 현재 이미지 구성에 따라 상위 MiroFish 이미지를 사용할 수 있음. mirollama 본격 개발 시에는 소스 직접 실행 권장.

---

## API 개요
- Health check: `GET /health`
- 온톨로지 생성: `POST /api/graph/ontology/generate`
- 그래프 구축: `POST /api/graph/build`
- 시뮬레이션 생성: `POST /api/simulation/create`
- 시뮬레이션 준비: `POST /api/simulation/prepare`
- 리포트 생성: `POST /api/report`

---

## 좋은 시뮬레이션을 위한 팁

### 시나리오는 구체적으로
나쁜 예: *"이 문서를 분석해줘"*
좋은 예: *"이 제품이 예상보다 높은 가격으로 출시되면 고객·경쟁사·미디어가 어떻게 반응할지 시뮬레이션"*

### 컨텍스트 풍부한 문서 업로드
좋은 시뮬레이션은 좋은 컨텍스트에서 나옵니다:
- 배경 정보
- 이해관계자 설명
- 충돌하는 의견
- 사전 사건
- 시장·사회적 맥락

### 복잡한 시뮬레이션엔 더 큰 모델
- 복잡한 문서 / 미묘한 시나리오: `gpt-oss:120b`
- 일반 로컬 테스트 (최소 기준): `gemma4:31b`

### 국가별 페르소나 데이터셋 (선택)
국가 특화 페르소나가 필요하면 Hugging Face에서 다운로드해 로컬 캐시로 사용:
- 한국: [https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)

권장 로컬 경로: `Nemotron-Personas-Korea/`

⚠️ `.arrow` 파일은 Git에 커밋하지 마세요. 대용량은 로컬 캐시·스토리지에만 보관.

---

## 보안 안내

mirollama는 **로컬 우선 실험용**으로 설계됐습니다. 백엔드를 공개 인터넷에 노출할 경우 다음을 반드시 설정:
- 인증
- CORS
- Secret key
- 업로드 크기 제한
- 파일 검증
- 네트워크 제한

민감 문서를 인증 없는 공개 배포에 노출하지 마세요.

---

## 라이선스
MIT

---

## 크레딧

mirollama는 [666ghj](https://github.com/666ghj)의 [MiroFish](https://github.com/666ghj/MiroFish) 파생 작업입니다.
