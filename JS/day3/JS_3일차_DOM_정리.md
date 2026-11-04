# JavaScript 3일차 정리 : DOM 조작

## 1. DOM (Document Object Model) 이란?
- 브라우저가 HTML 문서를 읽어서 만든 **나무(Tree) 모양의 객체 구조**.
- 태그 하나하나가 **노드(Node)** 가 되고, JS 는 이 노드를 찾아서 글자·스타일·구조를 바꿀 수 있음.

```
document
 └─ html
     ├─ head ─ title
     └─ body
         └─ div.calculator
             ├─ input#display
             └─ div.buttons ─ button × 18
```
- HTML 파일 자체를 바꾸는 것이 아니라, **메모리 위의 DOM** 을 바꾸면 화면이 즉시 바뀜.

## 2. Selector(선택자)로 DOM 요소 가져오기
| 메서드 | 반환 | 예시 |
|---|---|---|
| `document.querySelector(선택자)` | **첫 번째** 요소 1개 | `document.querySelector("#display")` |
| `document.querySelectorAll(선택자)` | 모든 요소 (NodeList) | `document.querySelectorAll(".number")` |
| `document.getElementById(id)` | id 요소 1개 | `document.getElementById("display")` |
| `document.getElementsByClassName(cls)` | 클래스 요소들 (HTMLCollection) | `...("number")` |

- `querySelector` 는 **CSS 선택자 문법 그대로** 사용 (`#id`, `.class`, `tag`, `[data-value="7"]`)

```js
const display = document.querySelector("#display");
display.value = "123";                 // input 의 값 바꾸기
document.querySelector("h1").textContent = "새 제목"; // 글자 바꾸기
document.querySelector(".calculator").classList.add("off"); // 클래스 추가
document.querySelectorAll(".number").forEach(btn => btn.style.color = "red");
```

## 3. Event(이벤트) 란?
- 사용자나 브라우저에서 **일어나는 일** : 클릭, 키 입력, 마우스 이동, 스크롤, 페이지 로드 등
- 대표 이벤트 : `click`, `dblclick`, `keydown`, `keyup`, `input`, `change`, `submit`, `mouseover`, `mouseout`, `mousemove`, `scroll`, `load`

## 4. EventListener (이벤트 리스너)
### 4-1. 이벤트 리스너란?
- "이 요소에서 **이런 이벤트가 생기면** **이 함수를 실행**해줘" 라고 등록해 두는 **감시자**.

### 4-2. 사용 목적 / 이유
- HTML 에 `onclick="..."` 를 직접 쓰면 **구조(HTML)와 동작(JS)이 섞여** 관리가 어려움.
- `addEventListener` 는
  - JS 파일 한 곳에서 동작을 관리 (역할 분리)
  - 한 요소에 **여러 개**의 리스너 등록 가능
  - `removeEventListener` 로 해제 가능
  - `event` 객체로 "무엇이, 어디서" 일어났는지 정보를 받을 수 있음

### 4-3. 정의하기
```js
요소.addEventListener("이벤트이름", 실행할함수);

const button = document.querySelector("#btn");
button.addEventListener("click", function (event) {
    console.log("클릭!", event.target); // event.target = 실제로 클릭된 요소
});
```

### 4-4. 응용
```js
// (1) 이벤트 위임 : 버튼 여러 개 대신 "부모"에 하나만 등록
document.querySelector(".buttons").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    console.log(button.dataset.value); // data-value 속성 읽기
});

// (2) 키보드 이벤트
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") console.log("엔터!");
});

// (3) 입력 이벤트 : 글자를 칠 때마다
document.querySelector("input").addEventListener("input", (e) => console.log(e.target.value));

// (4) 기본 동작 막기 : 폼 제출 시 새로고침 방지
form.addEventListener("submit", (e) => e.preventDefault());
```

## 5. 마우스 감지
### 5-1. 마우스 감지란?
- 마우스의 **움직임·위치·진입/이탈·버튼 클릭**을 이벤트로 알아내는 것.

| 이벤트 | 발생 시점 |
|---|---|
| `mouseover` / `mouseenter` | 요소 위로 마우스가 들어올 때 |
| `mouseout` / `mouseleave` | 요소 밖으로 나갈 때 |
| `mousemove` | 요소 위에서 움직일 때마다 |
| `mousedown` / `mouseup` | 버튼을 누를 때 / 뗄 때 |

### 5-2. 사용
```js
const box = document.querySelector(".box");

box.addEventListener("mouseenter", () => box.style.backgroundColor = "pink");
box.addEventListener("mouseleave", () => box.style.backgroundColor = "");

document.addEventListener("mousemove", (event) => {
    // clientX, clientY : 브라우저 창 기준 마우스 좌표
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
});
```

## 6. 화살표 함수 (Arrow Function)
### 6-1. 화살표 함수란?
- `function` 키워드 대신 `=>` 로 **짧게** 쓰는 함수 문법.

### 6-2. 사용
```js
// 일반 함수
function add(a, b) { return a + b; }

// 화살표 함수
const add2 = (a, b) => { return a + b; };
const add3 = (a, b) => a + b;   // 한 줄이면 { } 와 return 생략 가능
const double = x => x * 2;      // 매개변수 1개면 ( ) 생략 가능
const hello = () => "안녕";     // 매개변수 0개면 ( ) 필수

// 이벤트 리스너에서 자주 사용
button.addEventListener("click", () => console.log("클릭"));
[1, 2, 3].map(n => n * 10); // [10, 20, 30]
```
- 차이점 : 화살표 함수는 자신만의 `this` 를 갖지 않습니다. (객체 메서드에서는 일반 함수 사용)

## 7. 과제(DOM 계산기)와의 연결
| 개념 | 과제에서 사용한 곳 |
|---|---|
| `querySelector` | `#display`, `.buttons`, `.on-off` 가져오기 |
| `querySelectorAll` + `forEach` | 전원 OFF 시 모든 버튼 `disabled` |
| `addEventListener("click")` + 이벤트 위임 | `.buttons` 하나에 클릭 리스너 |
| `dataset` | `data-value="7"`, `data-action="enter"` 읽기 |
| `keydown` | 키보드 숫자/연산자/Enter/Esc 입력 |
| `classList.toggle` | 전원 상태에 따라 `.off`, `.on` 클래스 전환 |
| 화살표 함수 | 모든 리스너 콜백 |
