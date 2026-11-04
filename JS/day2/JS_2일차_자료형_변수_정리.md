# JavaScript 2일차 정리 : 자료형 · 변수 · 연산 · 조건문 · 반복문 · 배열 · 객체

## 1. 자료형 (Data Type)
| 자료형 | 예시 | 설명 |
|---|---|---|
| `number` | `10`, `3.14`, `-5`, `NaN`, `Infinity` | 정수·실수를 구분하지 않음 |
| `string` | `"안녕"`, `'JS'`, `` `템플릿` `` | 문자열 |
| `boolean` | `true`, `false` | 참/거짓 |
| `null` | `null` | "값이 **없음**"을 개발자가 **일부러** 넣은 것 |
| `undefined` | `let a;` → `a` | 변수는 있는데 **아직 값이 안 들어간** 상태 |

```js
console.log(typeof 10);        // "number"
console.log(typeof "hi");      // "string"
console.log(typeof true);      // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null);      // "object"  ← JS의 오래된 버그(유명함)
```

## 2. 변수 선언 : `let` vs `const`
```js
let count = 0;   count = 1;     // 재할당 O
const PI = 3.14; // PI = 3;      // 재할당 X → TypeError
const arr = [1, 2]; arr.push(3); // const 라도 "내용물" 변경은 가능 (주소가 같으므로)
```

## 3. 산술 연산
```js
10 + 3   // 13
10 - 3   // 7
10 * 3   // 30
10 / 3   // 3.3333...  (Python 과 달리 // 정수 나눗셈 없음)
10 % 3   // 1  (나머지)
2 ** 3   // 8  (거듭제곱)

Math.round(3.6) // 4  반올림
Math.floor(3.6) // 3  내림
Math.ceil(3.1)  // 4  올림
Math.max(1, 5, 3) // 5
Math.random()     // 0 이상 1 미만 난수
```

## 4. 비교 연산
```js
5 > 3    // true
5 <= 5   // true
5 == "5"  // true  ← 값만 비교 (타입을 몰래 바꿔서 비교)
5 === "5" // false ← 값 + 타입 비교 ✅ 항상 이것을 사용
5 !== "5" // true
```

## 5. 논리 연산
```js
true && false // false (AND : 둘 다 참이어야 참)
true || false // true  (OR  : 하나만 참이어도 참)
!true         // false (NOT : 반대로)
```

## 6. 문자열 연산
```js
const name = "고양이";
"안녕 " + name               // "안녕 고양이"
`안녕 ${name}, ${1 + 1}살`   // 템플릿 리터럴 : 백틱(`) 안에 ${ } 로 변수/식 삽입

// ⚠️ Python 과의 차이
"5" + 3   // JS : "53" (숫자를 문자로 바꿔 이어붙임)  /  Python : TypeError
"5" - 3   // JS : 2    (빼기는 문자를 숫자로 바꿈)
Number("5") + 3 // 8  ← 명시적으로 변환하는 습관!
```

## 7. 조건문 (Python 의 `elif` → JS 는 `else if`)
```js
const score = 85;
if (score >= 90) {
    console.log("A");
} else if (score >= 80) {
    console.log("B");
} else {
    console.log("C");
}
```

## 8. 반복문
```js
for (let i = 0; i < 3; i++) {   // 시작값; 조건; 증감
    console.log(i);              // 0, 1, 2
}

let n = 3;
while (n > 0) {                  // 조건이 참인 동안 반복
    console.log(n);
    n--;
}

for (const fruit of ["사과", "배"]) console.log(fruit); // 배열 값 순회
```

## 9. 배열 (Array)
```js
const nums = [10, 20, 30];
nums[0]          // 10
nums.length      // 3
nums.push(40)    // 끝에 추가 → [10,20,30,40]
nums.pop()       // 끝 제거
nums.includes(20)       // true
nums.map(x => x * 2)    // [20,40,60]  각 값을 변환
nums.filter(x => x > 15)// [20,30]     조건에 맞는 것만
nums.join(" + ")        // "10 + 20 + 30"
```

## 10. 객체 (Object)
```js
const cat = { name: "나비", age: 3 };   // 선언

cat.name          // "나비"     속성 읽기 (점 표기법)
cat["age"]        // 3          속성 읽기 (대괄호 표기법)
cat.color = "검정" // 속성 추가
cat.age = 4        // 속성 수정
delete cat.color   // 속성 제거
"name" in cat      // true      속성 존재 확인
```

## 11. 과제(콘솔 계산기)와의 연결
- `prompt()` 로 문자열 입력 → `string` 을 `Number()` 로 변환 (6번)
- 토큰을 **배열**에 담고 `for` 로 순회 (8, 9번)
- `if / else if` 로 연산자 구분 (7번)
- `*`, `/` 를 먼저 처리한 뒤 `+`, `-` 처리 → **두 번 순회**하여 우선순위 구현
