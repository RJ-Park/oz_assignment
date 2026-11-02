# Stage 1. Docker 수업 요점 정리

## Docker란?

**앱과 앱이 실행되는 환경을 함께 묶어서 배포하는 도구**

- 실행 환경 = OS, 파이썬 버전, 라이브러리, 앱 코드
- OS 위에 **격리된(따로 떨어진) 실행 환경**을 만들어 줌.
- 핵심: **실행 환경을 코드(파일)로 만든다.**

### 왜 쓰나?
| Docker 없이 | Docker 사용 |
|---|---|
| A는 Python 3.11, B는 3.9, 서버는 3.8 → 같은 코드인데 다르게 동작할 수 있음 | 환경을 파일로 고정 → 그 파일을 공유하면 누구나 같은 환경에서 실행, |

👉 "제 컴퓨터에서는 되는데요" 문제를 줄일 수 있음.



## Docker 핵심 개념

| 개념 | 뜻 | 상태 |
|---|---|---|
| **Image (이미지)** | 실행 환경의 설계도. OS + 라이브러리 + 앱 코드 들어 있음 | 실행 전, 고정된 파일 |
| **Container (컨테이너)** | 이미지를 실제로 실행한 것 | 실행 중인 독립된 프로세스 |

- 이미지 1개로 컨테이너를 여러 개 실행할 수 있음.
- 컨테이너를 지워도 이미지는 남아 있음.

### 기본 흐름
```
1. Dockerfile 작성
2. Dockerfile → Image 빌드      (docker build)
3. Image → Container 실행       (docker run)
4. 컨테이너 안에서 앱 동작
5. 컨테이너 종료 / 삭제          (docker stop / docker rm)
```

## Dockerfile이란?

**이미지를 만들기 위한 스크립트(명령 순서표)**
- 어떤 OS(베이스 이미지)를 쓰는지
- 어떤 라이브러리를 설치하는지
- 어떤 명령어로 실행하는지

### 수업 예시
```dockerfile
FROM python:3.13-slim                 # 베이스 이미지
WORKDIR /app                          # 컨테이너 안 작업 폴더
COPY . .                              # 내 파일 → 컨테이너로 복사
RUN pip install -r requirements.txt   # 라이브러리 설치 (빌드할 때 실행)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]  # 컨테이너 시작할 때 실행
```

| 명령 | 하는 일 | 언제 실행? |
|---|---|---|
| `FROM` | 베이스 이미지 고르기 | 빌드 |
| `WORKDIR` | 작업 폴더 정하기 | 빌드 |
| `COPY` | 파일 복사 | 빌드 |
| `RUN` | 설치 명령 | 빌드 |
| `CMD` | 앱 실행 명령 | **컨테이너 시작할 때** |

### `.dockerignore`
- 이미지를 빌드할 때 **넣지 않을 파일·폴더**를 적는 파일
- 수업 예시: 모델 파일은 크기가 커서 이미지에 넣지 않고 **볼륨으로 연결**함.

> 💡 **Stage 8에서 직접 해 보니**
> - `COPY . .`는 폴더를 **통째로** 복사해서 `.env`(비밀 정보), `.venv`, 캐시까지 이미지에 들어감.
> - `.dockerignore`는 **빌드하는 폴더(루트)**에 있어야 적용됨. `app/` 안에 두면 읽지 않음.
> - 적용 후 `docker run --rm 이미지명 ls -a /app`으로 이미지 안을 **직접 확인**했음.
> - 결과: 이미지 크기 **4.31GB → 1.91GB**

---

## 이미지 빌드 & 실행

### 빌드
```bash
docker build -t myapp .
```
- `.` = **현재 폴더를 기준으로** Dockerfile을 찾음.
- `-t myapp` = 이미지에 `myapp`이라는 이름(태그)을 붙임.

### 실행
```bash
docker run -p 8000:8000 -d --rm myapp
```
| 옵션 | 뜻 |
|---|---|
| `-p 8000:8000` | `<내 컴퓨터 포트>:<컨테이너 포트>` 연결 |
| `-d` | 백그라운드에서 실행 (터미널을 계속 쓸 수 있음) |
| `--rm` | 컨테이너가 멈추면 자동 삭제 |

### 기본 명령어
| 명령어 | 하는 일 |
|---|---|
| `docker images` | 내 컴퓨터에 있는 이미지 목록 |
| `docker ps` | 실행 중인 컨테이너 목록·상태 |
| `docker stop <이름 또는 ID>` | 실행 중인 컨테이너 **중지** |
| `docker rm <이름 또는 ID>` | 중지된 컨테이너 **삭제** |

> 💡 **Stage 8에서 직접 해 보니**
> - 팀 프로젝트는 Dockerfile이 `app/` 안에 있어서 `-f`로 위치를 알려 주고, 빌드 기준은 루트(`.`)로 했음.
>   `docker build -f app/Dockerfile -t oz-backoffice .`
> - 서버가 `0.0.0.0`으로 떠도 브라우저에서는 `http://localhost:8000`으로 접속.

---

## Docker Compose up / down

### Docker Compose란?
**여러 컨테이너를 하나의 서비스처럼 관리하는 도구**
- 실제 웹 서비스는 API 서버(FastAPI), DB(MySQL), Redis 등 컨테이너가 여러 개.
- 하나씩 따로 실행하면 네트워크 설정, 실행 순서 맞추기가 복잡함.
- `docker-compose.yml` 파일 하나에 실행 구조를 적어 두고 **한 번에 실행·중지**함.
- 장점: 실행 순서 관리(`depends_on`), 컨테이너끼리 **네트워크 자동 연결**

### 수업 예시 `docker-compose.yml`
```yaml
services:
  api:
    build: .              # 현재 폴더의 Dockerfile로 빌드
    ports:
      - "8000:8000"
    depends_on:
      - db                # db를 먼저 실행
  db:
    image: mysql:8.0      # 만들어진 이미지를 내려받아 사용
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: app_db
    ports:
      - "3306:3306"
```
- 컨테이너끼리는 **서비스 이름**으로 찾아감. 예: DB 주소가 `localhost`가 아니라 `db:3306`

### up / down
| 명령어 | 하는 일 |
|---|---|
| `docker compose up -d` | yml에 적힌 **모든 서비스를** 백그라운드로 실행 |
| `docker compose logs -f` | 로그를 계속 보기 |
| `docker compose down` | 실행 중인 모든 컨테이너 **중지 + 삭제** |

### ⚠️ down 하면 데이터가 사라진다 → 볼륨
- `down`은 컨테이너를 **삭제**하기 때문에, 컨테이너 안에 저장된 DB 데이터도 같이 지워짐.
- **볼륨(volume)**: 데이터 폴더를 컨테이너 **밖의 저장소**에 연결한다. 컨테이너가 지워져도 데이터는 남음.
```yaml
  db:
    volumes:
      - db_data:/var/lib/mysql   # MySQL 데이터 폴더를 db_data 볼륨에 저장
volumes:
  db_data:
```
- 응용: **코드 동기화** — `- .:/app`처럼 내 폴더를 컨테이너에 연결하면, 코드를 고칠 때마다 다시 빌드하지 않아도 바로 반영됨. (`--reload`와 함께 사용)

> 💡 **Stage 8에서 직접 해 보니**
> - 팀 compose는 fastapi + mysql 두 서비스, 코드 폴더 볼륨 연결 + `--reload`로 구성함.
> - 비밀번호는 yml에 직접 쓰지 않고 `.env`에서 읽어 오게 함. (깃에 올라가면 안 되니까)
