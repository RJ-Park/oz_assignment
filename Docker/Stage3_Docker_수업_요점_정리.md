# 모델 서빙 동시성 문제 해결

## 동시성 문제

- LLM(Transformer 계열) 모델은 답을 만드는 동안 **내부 상태**를 가지고 있음. (KV cache, attention buffer, context 등)
- 이런 모델은 기본적으로 **동시 요청에 안전하지 않음(thread-safe 하지 않음)**.
- 여러 요청이 **동시에 모델 하나**를 쓰면 → 내부 상태를 같이 쓰게 됨 → 동시에 고쳐지면서 **race condition** 발생
- 결과: 답의 **문맥이 섞이거나**, 앞 요청의 답이 이어서 나오는 등 **잘못된 응답**이 생김

### 수업에서 재현한 방법
- 터미널 2개에서 **동시에** 같은 요청을 보냄
```bash
curl -N -X POST http://127.0.0.1:8000/generate \
  -H "Content-Type: application/json" \
  -d '"너의 신년 계획에 대해서 얘기해줘"'
```

---

## 해결 방법 — Queue + Worker

**모델 추론을 별도의 Worker로 분리하고, Queue로 요청을 전달함**

```
                enqueue              dequeue
[FastAPI] ──(작업 넣기)──▶ [Queue] ──(하나씩 꺼내기)──▶ [Inference Worker]
    ▲                                                          │
    └──────────────── 결과 전달 (Pub/Sub) ──────────────────────┘
```

| 역할 | 하는 일 |
|---|---|
| **FastAPI** | 요청을 받아서 추론 작업을 **Queue에 추가**만 함. 직접 추론하지 않음 |
| **Queue** | 작업을 **순서대로 쌓아 두고**, 하나씩 처리하게 하는 구조 |
| **Worker** | Queue에서 작업을 **하나씩** 꺼내 모델로 추론함 → 모델을 **혼자 씀(독점)** → 상태가 꼬이지 않음 |
| **Pub/Sub** | Worker가 만든 결과를 다시 FastAPI로 보내는 통로 |

👉 FastAPI는 결과를 받아서 사용자에게 응답함.

---

## Redis — FastAPI와 Worker 사이의 연결 담당

- FastAPI와 Worker 사이를 연결해 줄 **중간 매개체**가 필요함
- 필요한 조건: 비동기 처리, 대기열(Queue), Pub/Sub 같은 메시징 패턴
- **Redis**
  - **메모리 기반**의 빠른 데이터 저장소
  - Queue, Pub/Sub 기능을 지원함

| 용어 | 뜻 |
|---|---|
| **Queue (큐)** | 먼저 들어온 작업이 먼저 나가는 대기열 |
| **enqueue / dequeue** | 큐에 넣기 / 큐에서 꺼내기 |
| **Pub/Sub** | Publish(보내기) / Subscribe(구독하기). 구독한 채널로 보낸 메시지를 받음 |

---

## 실습 코드로 보는 흐름

### 폴더 구조
```
docker/
├── docker-compose.yml
├── api/          ← FastAPI (요청 받기)
│   ├── Dockerfile
│   └── main.py
└── llm/          ← Worker (모델 추론)
    ├── Dockerfile
    ├── main.py
    └── models/   ← 모델 파일 (이미지에 넣지 않고 볼륨으로 연결)
```

### 요청 하나가 처리되는 순서

| 순서 | 어디서 | 코드 | 하는 일 |
|---|---|---|---|
| ① | `api/main.py` | `pubsub.subscribe(channel)` | 이 요청만의 채널(`uuid`)을 만들고 **구독**함 |
| ② | `api/main.py` | `redis_client.lpush("queue", ...)` | 질문 + 채널 이름을 **큐에 넣음** (enqueue) |
| ③ | `llm/main.py` | `redis_client.brpop("queue")` | Worker가 큐에서 작업을 **하나 꺼냄** (dequeue). 큐가 비어 있으면 **기다림** |
| ④ | `llm/main.py` | `llm.create_chat_completion(..., stream=True)` | 모델로 **추론**함 |
| ⑤ | `llm/main.py` | `redis_client.publish(channel, token)` | 만든 글자(토큰)를 그 채널로 **하나씩 보냄** |
| ⑥ | `llm/main.py` | `publish(channel, "[DONE]")` | 다 끝나면 **끝 신호**를 보냄 |
| ⑦ | `api/main.py` | `pubsub.listen()` → `StreamingResponse` | 받은 토큰을 사용자에게 **바로바로 보여 줌**. `[DONE]`이 오면 구독 해제 |

- `lpush`(왼쪽에 넣기) + `brpop`(오른쪽에서 꺼내기) → **먼저 들어온 작업이 먼저** 처리됨
- 요청마다 채널이 따로라서 **내 답이 다른 사람에게 가지 않음**
- Worker의 `run()`은 `while True`로 **계속 돌면서** 다음 작업을 기다림

---

## Docker 설정에서 바뀐 것

### `docker-compose.yml` — 서비스 4개
```yaml
services:
  api:
    build: ./api            # api 폴더의 Dockerfile로 빌드
    ports:
      - 9000:8000           # 내 컴퓨터 9000 → 컨테이너 8000
    volumes:
      - ./api:/app          # 코드 동기화
    depends_on:
      - db
      - redis               # redis 먼저 실행
  db:
    image: mysql:8.0
    volumes:
      - local_db:/var/lib/mysql   # DB 데이터 보존 (볼륨)
  redis:
    image: redis:8          # 만들어진 Redis 이미지 사용
  llm:
    build: ./llm
    volumes:
      - ./llm/models:/app/models  # 모델 파일은 볼륨으로 연결
    depends_on:
      - redis
volumes:
  local_db:
```
- 컨테이너끼리는 **서비스 이름**으로 찾아감 → 코드에서 Redis 주소가 `redis://redis:6379`

### Worker의 `Dockerfile`
```dockerfile
FROM python:3.13
WORKDIR /app
COPY . .
RUN pip install llama-cpp-python redis
CMD ["python", "-u", "main.py"]     # 웹 서버가 아니라 파이썬 파일을 계속 실행
```
- `-u`: 출력을 바로바로 보여 줌 → `docker compose logs`로 확인하기 좋음

### `.dockerignore`
```bash
echo "models/" >> .dockerignore
```
- 모델 파일은 **크기가 커서** 이미지에 넣지 않고 **볼륨으로 연결**함

---

## 실행 & 확인

```bash
docker compose up --scale worker=2
```
- `--scale`: 같은 서비스를 **여러 개** 실행함 → 요청이 많으면 Worker를 늘려서 처리량을 높일 수 있음
- Worker가 여러 개여도 **Worker 하나당 모델 하나를 혼자 쓰니까** 상태가 꼬이지 않음
- 터미널 2개에서 동시에 `curl` 요청을 보내 **답이 섞이지 않는지** 확인함

---

## 한 줄 요약

- **문제**: 모델 하나를 여러 요청이 동시에 쓰면 내부 상태가 섞여서 답이 꼬임
- **해결**: `FastAPI(요청 받기) → Redis Queue(줄 세우기) → Worker(하나씩 추론) → Redis Pub/Sub(결과 전달)`
- **Docker**: api / db / redis / worker를 compose로 한 번에 실행, 모델 파일은 볼륨으로 연결, `--scale`로 Worker 늘리기
