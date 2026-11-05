# FastAPI 회원·인증 수업 요점 정리 (risk_predict)



## 1. 프로젝트 구조

```
risk_predict/
├── .env                 # 비밀 값 (OpenAI 키, JWT 비밀키) → .gitignore로 깃에 안 올림
├── project.db           # SQLite DB 파일
├── database/
│   ├── connection.py    # DB 연결, 세션
│   └── orm.py           # Base, 테이블 생성
├── user/
│   ├── main.py          # FastAPI 앱, 라우터 연결
│   ├── config.py        # .env 읽기 (pydantic-settings)
│   ├── model.py         # 테이블 (User, UserHealthProfile)
│   ├── request.py       # 요청 형식
│   ├── response.py      # 응답 형식
│   ├── auth.py          # 비밀번호 해싱, JWT
│   └── router.py        # API (회원가입, 로그인, 건강 프로필)
└── prediction/
    └── router.py        # (비어 있음 → 다음 수업 예정, main.py에서 주석 처리)
```

- 기능(user, prediction)별로 폴더를 나누고, 각 폴더 안에 model / request / response / router를 둠

---

## 2. 비동기 DB 연결 (`database/connection.py`)

```python
DATABASE_URL = "sqlite+aiosqlite:///project.db"
engine = create_async_engine(DATABASE_URL, echo=True)
SessionFactory = async_sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

async def get_session():
    session = SessionFactory()
    try:
        yield session
    finally:
        await session.close()
```

| 코드 | 뜻 |
|---|---|
| `sqlite+aiosqlite` | SQLite를 **비동기**로 쓰는 드라이버. DB가 파일(`project.db`) 하나라 따로 서버를 안 띄워도 됨 |
| `create_async_engine` | 비동기 DB 연결 |
| `echo=True` | 실행되는 SQL을 터미널에 보여 줌 (공부할 때 편함) |
| `expire_on_commit=False` | commit 후에도 객체 값을 그대로 쓸 수 있게 함 |
| `get_session()` + `yield` | 요청마다 세션을 하나 주고, 요청이 끝나면 **반드시 닫음** (`finally`) |

- API에서는 `session = Depends(get_session)`으로 받아 씀

---

## 3. 테이블 만들기 (`database/orm.py`, `user/model.py`)

```python
class Base(DeclarativeBase):
    pass

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)   # Base를 상속한 테이블 전부 생성
```

### User / UserHealthProfile

| 테이블 | 컬럼 |
|---|---|
| `user` | id(PK, 자동 증가), email(**unique**), password_hash, created_at |
| `user_health_profile` | id, **user_id(FK → user.id, unique)**, age, height_cm, weight_kg, smoking, exercise_per_week, created_at |

| 문법 | 뜻 |
|---|---|
| `Mapped[int] = mapped_column(Integer, ...)` | 파이썬 타입 + DB 컬럼 타입을 같이 적음 |
| `primary_key=True, autoincrement=True` | 번호를 자동으로 1, 2, 3… |
| `unique=True` | 같은 값이 두 번 들어갈 수 없음 |
| `ForeignKey("user.id")` | 다른 테이블(user)의 id를 가리킴 |
| `server_default=func.now()` | 값을 안 넣으면 **DB가** 현재 시간을 넣음 |

- `user_id`에 `ForeignKey` + `unique` → 사용자 1명당 건강 프로필 **1개** (1:1 관계)
- 비밀번호는 **그대로 저장하지 않고** 해싱한 값(`password_hash`)만 저장

---

## 4. 요청·응답 형식 (`user/request.py`, `user/response.py`)

| 클래스 | 용도 | 필드 |
|---|---|---|
| `SignUpRequest` | 회원가입 요청 | email(`EmailStr`), password |
| `LogInRequest` | 로그인 요청 | email, password |
| `CreateHealthProfileRequest` | 건강 프로필 요청 | age, height_cm, weight_kg, smoking, exercise_per_week |
| `SignUpResponse` | 회원가입 응답 | id, email, created_at (**비밀번호는 안 보냄**) |
| `LogInResponse` | 로그인 응답 | access_token |

- `EmailStr`: 이메일 모양이 아니면 자동으로 **422**
- `response_model=SignUpResponse`: DB 객체를 돌려줘도 **이 형식에 있는 값만** 응답으로 나감 → `password_hash`가 밖으로 안 나감

---

## 5. 비밀번호 해싱 & JWT (`user/auth.py`)

### 비밀번호 해싱 (bcrypt)
| 함수 | 하는 일 |
|---|---|
| `hash_password(plain_password)` | 비밀번호 → 되돌릴 수 없는 값(해시)으로 바꿈. salt를 붙여서 같은 비밀번호도 매번 다른 값이 됨 |
| `verify_password(plain_password, password_hash)` | 입력한 비밀번호를 같은 방식으로 바꿔서 저장된 해시와 맞는지 확인 → True/False |

### JWT (로그인 증표)
| 함수 | 하는 일 |
|---|---|
| `create_access_token(user_id)` | `sub`(사용자 id) + `exp`(만료 시간)를 담아 **비밀키로 서명**한 토큰 발급 |
| `verify_user` | 요청 헤더 `Authorization: Bearer <토큰>`을 읽어 토큰이 **위조·만료되지 않았는지** 확인 → user_id 돌려줌. 문제 있으면 **401** |

- JWT는 `헤더.내용.서명` 3부분. 내용은 누구나 읽을 수 있으므로 **비밀번호 같은 값은 넣지 않음**
- 서명 비밀키(`jwt_secret_key`)는 `.env`에만 둠

---

## 6. API (`user/router.py`)

### 회원가입 `POST /users` → 201
1. 이메일 중복 검사 → 있으면 **409** "이미 가입된 이메일입니다."
2. 비밀번호 해싱
3. `session.add()` → `await session.commit()`으로 저장

### 로그인 `POST /users/login` → 200
1. 이메일로 사용자 조회 → 없으면 **401**
2. 비밀번호 검증 → 틀리면 **401**
3. JWT 발급 → `{"access_token": ...}`

- 이메일이 없을 때와 비밀번호가 틀릴 때 **같은 문장**("이메일과 비밀번호가 잘못 되었습니다.")을 씀 → 어떤 이메일이 가입돼 있는지 알려 주지 않기 위해

### 건강 프로필 생성 `POST /health-profiles` → 201
```python
user_id = Depends(verify_user)   # 헤더에 JWT 토큰 요구하도록 명시
```
- 토큰이 없거나 잘못되면 함수 안으로 들어오기 전에 **401**
- 지금은 `{"user_id": user_id}`만 돌려줌 → 프로필 저장은 다음 수업에서 이어서 할 예정으로 보임

---

## 7. 설정 (`user/config.py`, `.env`)

```python
class Settings(BaseSettings):
    openai_api_key: str
    jwt_secret_key: str
    model_config = SettingsConfigDict(env_file=".env")
```
- `.env` 파일 값을 읽어 `settings.jwt_secret_key`처럼 씀
- 값이 없으면 서버가 켜질 때 바로 에러 → 설정 빠뜨린 걸 빨리 알 수 있음
- `.gitignore`에 `.env` → **API 키·비밀키가 깃에 안 올라감**

---

## 💡 팀 프로젝트와 비교

| | 수업 (risk_predict) | 팀 프로젝트 (Oz_codingSchool) |
|---|---|---|
| DB | SQLite (`aiosqlite`) | MySQL (`asyncmy`) |
| 테이블 만들기 | `create_all` | alembic 마이그레이션 |
| 비밀번호 해싱 | bcrypt | pwdlib (argon2) |
| 토큰 확인 | `Depends(verify_user)` | `CurrentUser` 같은 의존성 타입 |
| 구조 | 기능별 폴더 (user/, prediction/) | 계층별 폴더 (apis/, services/, repositories/) |
