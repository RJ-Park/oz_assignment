# JavaScript 1일차 정리

## 1. JavaScript 란?
- 웹 페이지에 **움직임(동작)** 을 더하는 프로그래밍 언어.
- 역할 분담
  | 언어 | 역할 | 비유 |
  |---|---|---|
  | HTML | 구조 (무엇이 있는가) | 뼈대 |
  | CSS | 모양 (어떻게 보이는가) | 옷 |
  | JavaScript | 동작 (어떻게 반응하는가) | 근육 |
- 브라우저가 JS를 직접 실행하므로 설치 없이 바로 사용 가능 (서버에서는 Node.js 로 실행)

## 2. HTML 에 JavaScript 연결하기
```html
<!-- ① 내부 스크립트 -->
<script>
    console.log("안녕하세요!");
</script>

<!-- ② 외부 스크립트 (권장) : body 닫기 직전에 넣으면 HTML 이 다 그려진 뒤 실행됨 -->
<script src="./app.js"></script>
```

## 3. 콘솔(Console) 사용하기
- 열기 : Windows `F12`, Mac `Option + Command + I` → **Console** 탭
- `console.log(값)` : 값을 출력 / `console.error()` : 빨간 오류 출력 / `console.table()` : 표 형태 출력

## 4. 변수 선언
```js
let age = 20;          // 바꿀 수 있는 변수
age = 21;              // OK

const name = "고양이"; // 바꿀 수 없는 상수
// name = "강아지";    // ❌ TypeError

var old = "옛날 방식"; // 요즘은 잘 쓰지 않음 (범위 규칙이 헷갈림)
```
- **원칙** : 기본은 `const`, 값이 바뀌어야 할 때만 `let`.

## 5. 오늘 과제에서 같이 쓴 CSS 도구
### CSS Grid
- 행(row)과 열(column)을 **동시에** 다루는 2차원 레이아웃.
```css
.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 최소 200px, 남는 공간은 똑같이 */
    gap: 20px;
}
```
- Flexbox = 한 줄(1차원) 정렬에 강함 / Grid = 바둑판(2차원) 배치에 강함.

### Bootstrap
- 미리 만들어진 CSS/JS 모음. **클래스 이름만 붙이면** 디자인 적용됨.
- 이번에 사용한 것 : `row` / `col-md-6` (12칸 그리드), `card`, `badge`, `progress`, `table`, `modal`
- 주의 : Bootstrap 에도 `.container` 같은 클래스가 있으므로 내 클래스와 이름이 겹치지 않게 함.
- 내 CSS 는 **Bootstrap 다음 줄**에 불러와야 내 스타일이 우선 적용됨.
