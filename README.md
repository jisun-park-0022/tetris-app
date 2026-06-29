# Tetris

브라우저에서 바로 실행 가능한 풀스택 테트리스 게임입니다.  
순수 HTML/CSS/JavaScript 프론트엔드와 FastAPI 백엔드로 구성되며, 회원 인증·점수 저장·리더보드·AI 자동 플레이 기능을 제공합니다.

---

## 화면 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  TETRIS (클릭 시 처음 화면으로)        [로그인] [회원가입]  │  ← 헤더
│  (로그인 후)  user@example.com          [로그아웃]         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ How to Play │  │                │  │  Score       │  │
│  │ Scoring     │  │  게임 보드     │  │  1200        │  │
│  │ Best Scores │  │  (10 × 20)     │  │  Next        │  │
│  │  🥇 alice   │  │                │  │  [미리보기]  │  │
│  │  🥈 bob     │  │                │  │  Controls    │  │
│  │  🥉 charlie │  │                │  │  [Restart]   │  │
│  │ Tips        │  │                │  │  [🔊 Music]  │  │
│  └─────────────┘  └────────────────┘  │  [🤖 Auto]   │  │
│    (왼쪽 패널)       (캔버스)           └──────────────┘  │
│                                          (오른쪽 패널)    │
└──────────────────────────────────────────────────────────┘
```

> `🤖 Auto` 버튼은 **게스트 모드**에서만 표시됩니다.

---

## 프로젝트 구조

```
tetris/
├── index.html                  # 메인 HTML (오버레이, 모달 포함)
│
├── css/
│   ├── style.css               # 전체 레이아웃, CSS 변수, 다크 테마
│   ├── game.css                # 게임 캔버스, 패널, 버튼 스타일
│   └── auth.css                # 로그인/회원가입 모달, 리더보드, 헤더 스타일
│
├── js/
│   ├── piece.js                # 7종 테트로미노 정의 + 회전 로직
│   ├── board.js                # 10×20 보드 상태, 유효성 검사, 줄 제거
│   ├── ai.js                   # TetrisAI 클래스 (El-Tetris 휴리스틱)
│   ├── game.js                 # 게임 루프, 입력 처리, 렌더링, Auto 모드
│   ├── audio.js                # Web Audio API 배경음악 (Korobeiniki)
│   ├── api.js                  # 백엔드 fetch 래퍼, JWT 토큰 관리
│   └── auth-ui.js              # 인증 UI 이벤트, 리더보드 렌더링
│
├── backend/
│   ├── main.py                 # FastAPI 앱, CORS 미들웨어
│   ├── database.py             # SQLAlchemy 엔진, 세션, Base
│   ├── models.py               # User, Score ORM 모델
│   ├── schemas.py              # Pydantic 요청/응답 스키마
│   ├── auth.py                 # bcrypt 해싱, JWT 생성/검증, get_current_user
│   ├── routers/
│   │   ├── auth.py             # POST /auth/register, /auth/login, GET /auth/me
│   │   └── scores.py           # POST /scores, GET /scores/me, /scores/leaderboard
│   ├── tetris.db               # SQLite 데이터베이스 (자동 생성)
│   ├── .env                    # 환경 변수 (SECRET_KEY 등)
│   ├── requirements.txt        # 런타임 의존성
│   ├── requirements-test.txt   # 테스트 의존성
│   ├── pytest.ini              # pytest 설정
│   └── tests/
│       ├── conftest.py         # 공통 픽스처 (in-memory DB, TestClient)
│       ├── test_auth_utils.py  # hash_password, verify_password, create_access_token
│       ├── test_auth_router.py # /auth 엔드포인트 테스트
│       ├── test_scores_router.py # /scores 엔드포인트 테스트
│       └── test_health.py      # /health 엔드포인트 테스트
│
├── README.md
├── PLAN.md
└── GITHUB_PAGES.md             # GitHub Pages 배포 가이드
```

---

## 주요 기능

### 게임

| 기능 | 설명 |
|------|------|
| 10×20 보드 | Canvas API로 렌더링, 격자 선 포함 |
| 7종 테트로미노 | I / O / T / S / Z / J / L |
| 키보드 조작 | `←` `→` 이동, `↑` 회전, `↓` 소프트 드롭, `Space` 하드 드롭 |
| 벽 킥 | 회전 시 벽에 막히면 좌우 시프트 자동 시도 |
| Ghost Piece | 블록 낙하 위치 반투명 미리보기 |
| Next Piece | 다음 블록 미리보기 패널 |
| 점수 | 줄 수 × 100점 (1줄=100, 2줄=200, 3줄=300, 4줄=400) |
| 배경음악 | Web Audio API로 Korobeiniki(테트리스 테마) 생성, 뮤트 토글 |
| Start Overlay | 최초 접속 시 게임 즉시 시작 방지, 선택 화면 표시 |
| Game Over | 오버레이 표시, 점수 저장 안내, Play Again 버튼 |
| 처음으로 | 헤더의 TETRIS 로고 클릭 시 초기 선택 화면으로 복귀 |

### 인증 / 회원

| 기능 | 설명 |
|------|------|
| 회원가입 | 이메일 + 비밀번호(6자 이상), 이메일 인증 없음 |
| 로그인 | JWT 발급 (유효기간 24시간), localStorage 저장 |
| 게스트 모드 | 회원가입 없이 게임 시작 (점수 저장 불가) |
| 자동 로그아웃 | 게스트 모드 선택 시 기존 로그인 세션 삭제 |
| 모달 중 게임 일시정지 | 로그인/회원가입 모달 열리면 게임 pause, 닫으면 resume |

### 점수 / 리더보드

| 기능 | 설명 |
|------|------|
| 점수 저장 | 로그인 상태에서 Game Over 시 자동 저장 |
| 내 점수 조회 | 최근 10개, 점수 내림차순 |
| Best Scores 대시보드 | 사용자별 최고점 집계, 상위 10명, 실시간 갱신 |
| 순위 표시 | 🥇🥈🥉 메달 + 현재 로그인 사용자 행 강조 |

### AI Auto Play

| 기능 | 설명 |
|------|------|
| 알고리즘 | El-Tetris 휴리스틱: `score = lines×0.76 − height×0.51 − holes×0.36 − bumpiness×0.18` |
| 탐색 방식 | 0~3회 회전 × 전체 x 좌표 조합 시뮬레이션 후 최고점 선택 |
| 속도 | 블록당 400ms 간격 (육안으로 확인 가능한 속도) |
| 접근 제한 | **게스트 모드 전용** — 로그인 상태에서는 버튼 숨김 |
| 키보드 차단 | Auto ON 중 키보드 입력 무시 |

---

## 기술 스택

### 프론트엔드

| 항목 | 내용 |
|------|------|
| 언어 | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| 렌더링 | Canvas API |
| 음악 | Web Audio API (OscillatorNode, GainNode) |
| 인증 | JWT — localStorage 저장, Authorization: Bearer 헤더 전송 |
| 빌드 도구 | 없음 (정적 파일) |

### 백엔드

| 항목 | 내용 |
|------|------|
| 언어 | Python 3.10+ |
| 프레임워크 | FastAPI 0.111 |
| 서버 | Uvicorn 0.29 |
| ORM | SQLAlchemy 2.0 |
| 데이터베이스 | SQLite (`tetris.db`) |
| 인증 | JWT (python-jose, HS256), bcrypt (passlib) |
| 유효성 검사 | Pydantic v2 |
| CORS | `http://localhost:8080`, `http://127.0.0.1:8080` 허용 |

### 테스트

| 항목 | 내용 |
|------|------|
| 프레임워크 | pytest 7.4+ |
| HTTP 클라이언트 | httpx (FastAPI TestClient) |
| 데이터베이스 | SQLite in-memory + StaticPool |
| 격리 방식 | 테스트마다 독립 DB, `get_db` 의존성 오버라이드 |

---

## 로컬 실행 방법 (Ubuntu 22.04)

### 사전 요구사항

```bash
python3 --version   # Python 3.10 이상 필요
# pip가 없는 경우 설치
curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
python3 /tmp/get-pip.py
```

### 1. 백엔드 의존성 설치

```bash
cd tetris/backend
pip3 install -r requirements.txt
```

### 2. 환경 변수 확인

`backend/.env` 파일이 없으면 생성합니다.

```bash
cat > tetris/backend/.env << 'EOF'
SECRET_KEY=tetris-super-secret-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF
```

> 운영 환경에서는 `SECRET_KEY`를 반드시 안전한 값으로 교체하세요.

### 3. 백엔드 서버 실행

```bash
cd tetris/backend
~/.local/bin/uvicorn main:app --reload --port 8000
```

서버가 정상 실행되면 아래와 같이 출력됩니다.

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

API 문서(Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. 프론트엔드 서버 실행

새 터미널을 열어 Python HTTP 서버를 실행합니다.

```bash
cd tetris
python3 -m http.server 8080
```

브라우저에서 [http://localhost:8080](http://localhost:8080) 접속

> 백엔드와 프론트엔드를 **동시에 실행**해야 로그인·점수 저장·리더보드 기능을 사용할 수 있습니다.  
> 백엔드 없이 프론트엔드만 실행해도 게스트 모드로 게임 플레이는 가능합니다.

### 5. 백그라운드 실행 (선택)

두 서버를 백그라운드로 실행하려면:

```bash
# 백엔드
cd tetris/backend
nohup ~/.local/bin/uvicorn main:app --port 8000 > uvicorn.log 2>&1 &

# 프론트엔드
cd tetris
nohup python3 -m http.server 8080 > http.log 2>&1 &
```

서버 종료:

```bash
pkill -f "uvicorn main:app"
pkill -f "http.server 8080"
```

---

## 테스트 실행 방법 (Ubuntu 22.04)

### 테스트 의존성 설치

```bash
cd tetris/backend
pip3 install -r requirements-test.txt
```

### 전체 테스트 실행

```bash
cd tetris/backend
~/.local/bin/pytest -v
```

정상 실행 시 출력 예시:

```
============================= test session starts ==============================
platform linux -- Python 3.10.12, pytest-9.1.1
testpaths: tests
collected 58 items

tests/test_auth_router.py::TestRegister::test_register_success PASSED
tests/test_auth_router.py::TestRegister::test_register_duplicate_email PASSED
...
tests/test_scores_router.py::TestLeaderboard::test_leaderboard_response_schema PASSED
tests/test_health.py::test_health_returns_ok PASSED

======================== 58 passed in 18.15s ========================
```

### 특정 파일만 실행

```bash
# 인증 유틸 함수 테스트만
~/.local/bin/pytest tests/test_auth_utils.py -v

# /auth 엔드포인트 테스트만
~/.local/bin/pytest tests/test_auth_router.py -v

# /scores 엔드포인트 테스트만
~/.local/bin/pytest tests/test_scores_router.py -v
```

### 테스트 구성 (총 58개)

| 파일 | 테스트 수 | 대상 |
|------|-----------|------|
| `test_auth_utils.py` | 14 | `hash_password`, `verify_password`, `create_access_token` |
| `test_auth_router.py` | 20 | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| `test_scores_router.py` | 22 | `POST /scores`, `GET /scores/me`, `GET /scores/leaderboard` |
| `test_health.py` | 2 | `GET /health` |

---

## API 엔드포인트

### 인증

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/auth/register` | 회원가입 | X |
| POST | `/auth/login` | 로그인 → JWT 발급 | X |
| GET | `/auth/me` | 현재 사용자 정보 조회 | O |

#### POST /auth/register

```json
// 요청
{ "email": "user@example.com", "password": "password123" }

// 응답 201
{ "id": 1, "email": "user@example.com", "created_at": "2026-06-29T10:00:00" }
```

#### POST /auth/login

```json
// 요청
{ "email": "user@example.com", "password": "password123" }

// 응답 200
{ "access_token": "<JWT>", "token_type": "bearer" }
```

### 점수

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/scores` | 점수 저장 | O |
| GET | `/scores/me` | 내 점수 목록 (최대 10개, 내림차순) | O |
| GET | `/scores/leaderboard` | 사용자별 최고점 상위 10명 | X |

#### GET /scores/leaderboard

```json
// 응답 200
[
  { "rank": 1, "email": "alice@example.com", "best_score": 5400 },
  { "rank": 2, "email": "bob@example.com",   "best_score": 3200 }
]
```

### 헬스 체크

| 메서드 | 경로 | 응답 |
|--------|------|------|
| GET | `/health` | `{ "status": "ok" }` |

---

## 환경 변수 (`backend/.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `SECRET_KEY` | `tetris-super-secret-key-...` | JWT 서명 키 (운영 시 반드시 변경) |
| `ALGORITHM` | `HS256` | JWT 알고리즘 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 토큰 유효기간 (분, 기본 24시간) |

---

## 데이터베이스 스키마

```sql
CREATE TABLE users (
    id              INTEGER PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    score      INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

`tetris.db`는 백엔드 최초 실행 시 자동 생성됩니다.

---

## 키보드 조작

| 키 | 동작 |
|----|------|
| `←` / `→` | 블록 좌우 이동 |
| `↑` | 블록 시계 방향 회전 (벽 킥 포함) |
| `↓` | 소프트 드롭 (한 칸 내리기) |
| `Space` | 하드 드롭 (즉시 낙하) |

> Auto 모드 ON 상태에서는 키보드 입력이 비활성화됩니다.
