# JavaScript 4일차 정리 : Web API

## 1. Web API 의 정의
- **브라우저가 JavaScript 에게 제공하는 기능 모음**입니다.
- JS 언어 자체(변수, 반복문 등)에는 "화면 바꾸기", "1초 기다리기", "서버에 요청하기" 기능 없음.
  이런 기능은 **브라우저가 API 형태로 빌려줍니다.**
- 그래서 Node.js(서버) 환경에서는 `document`, `localStorage` 등이 없음.

## 2. Web API 예시

### 2-1. DOM API : HTML 요소 찾기·바꾸기
```js
const title = document.querySelector("h1");
title.textContent = "실시간 암호화폐 추적기";
title.classList.add("active");
document.querySelector("tbody").innerHTML = "<tr><td>BTCUSDT</td></tr>";
```

### 2-2. Event API : 사용자 행동에 반응
```js
const input = document.querySelector("#search");
input.addEventListener("input", (event) => {
    console.log("검색어:", event.target.value);
});
```

### 2-3. Timer API : 시간 지연 / 반복
```js
const timeoutId = setTimeout(() => console.log("3초 뒤 1번 실행"), 3000);
const intervalId = setInterval(() => console.log("1초마다 실행"), 1000);

clearTimeout(timeoutId);  // 예약 취소
clearInterval(intervalId); // 반복 중지
```

### 2-4. Storage API : 브라우저에 데이터 저장
| | `localStorage` | `sessionStorage` |
|---|---|---|
| 유지 기간 | 직접 지울 때까지 영구 | 탭을 닫으면 삭제 |
| 범위 | 같은 사이트의 모든 탭 | 현재 탭만 |

```js
// 문자열만 저장 가능 → 배열/객체는 JSON 으로 변환
localStorage.setItem("favorites", JSON.stringify(["BTCUSDT"]));
const favs = JSON.parse(localStorage.getItem("favorites")) ?? [];
localStorage.removeItem("favorites");
localStorage.clear();
```
- 확인 방법 : 개발자도구 → **Application** 탭 → Storage → Local storage

### 2-5. Fetch API : 서버에 HTTP 요청
```js
// then 방식
fetch("https://api4.binance.com/api/v3/ticker/24hr")
    .then((response) => response.json())  // 응답 본문을 JSON 으로
    .then((data) => console.log(data))
    .catch((error) => console.error(error));

// async / await 방식 (더 읽기 쉬움)
async function load() {
    try {
        const response = await fetch("https://api4.binance.com/api/v3/ticker/24hr");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log(data.length);
    } catch (error) {
        console.error("요청 실패", error);
    }
}
```
- `fetch` 는 **비동기** : 응답을 기다리는 동안 다른 코드가 먼저 실행됨.
- GET 이 기본. POST 는 `fetch(url, { method: "POST", headers: {...}, body: JSON.stringify(data) })`

## 3. 과제(암호화폐 추적기)에서 쓴 Web API
| API | 사용 위치 |
|---|---|
| Fetch | `fetchPrices()` — 바이낸스 24시간 시세 요청 |
| Timer | `setInterval(fetchPrices, 1000)` — 1초마다 갱신 |
| DOM | `tbody.innerHTML` 로 표 다시 그리기, `classList` 로 탭 활성화 |
| Event | 검색 `input`, 탭/별 `click` (이벤트 위임) |
| Storage | `localStorage["favorites"]` 에 관심 심볼 배열 저장 |
