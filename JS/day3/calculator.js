// DOM 요소 가져오기
const calculatorEl = document.querySelector(".calculator");
const display = document.querySelector("#display");
const buttonArea = document.querySelector(".buttons");
const allButtons = document.querySelectorAll(".buttons button");
const powerButton = document.querySelector(".on-off");

// 계산기 현재 상태 기억하기
const OPERATORS = ["+", "-", "*", "/"];
let expression = "0";      // 현재 입력된 계산식 (문자열)
let isOn = true;           // 전원 상태
let justCalculated = false; // 방금 Enter 로 결과를 본 상태인지

// 화면 표시
function render() {
    display.value = isOn ? expression : "";
    // 글자가 길어지면 입력창을 오른쪽 끝으로 스크롤 → 최근 입력이 보이게
    display.scrollLeft = display.scrollWidth;
}

// 마지막 글자 / 현재 입력 중인 숫자 구하기 도우미 함수
const lastChar = () => expression[expression.length - 1];
const currentNumber = () => expression.split(/[+\-*/]/).pop();

// 버튼 동작
function appendNumber(value) {
    // 결과를 본 직후 숫자를 누르면 새 계산 시작
    if (justCalculated || expression === "Error") {
        expression = "0";
        justCalculated = false;
    }

    if (value === ".") {
        if (currentNumber().includes(".")) return;          // 한 숫자에 점은 한 번만
        if (OPERATORS.includes(lastChar())) expression += "0";
        expression += ".";
    } else if (expression === "0") {
        expression = value;                                   // 처음 0 은 숫자로 교체
    } else {
        expression += value;
    }
    render();
}

function appendOperator(operator) {
    if (expression === "Error") expression = "0";
    justCalculated = false; // 결과 뒤에 연산자를 누르면 그 결과에 이어서 계산

    const last = lastChar();

    if (OPERATORS.includes(last)) {
        // 음수 입력 허용
        if (operator === "-" && (last === "*" || last === "/")) {
            expression += operator;
        } else {
            // 연산자 교체
            expression = expression.replace(/[+\-*/]+$/, "") + operator;
        }
    } else if (last === ".") {
        expression = expression.slice(0, -1) + operator;
    } else {
        expression += operator;
    }
    render();
}

function clearDisplay() {
    expression = "0";
    justCalculated = false;
    render();
}

function deleteLast() {
    if (justCalculated || expression === "Error") return clearDisplay();
    expression = expression.length > 1 ? expression.slice(0, -1) : "0";
    render();
}

function performCalculate() {
    try {
        const result = calculate(expression);
        expression = String(result);
    } catch (error) {
        console.warn(`계산 오류: ${error.message}`);
        expression = "Error";
    }
    justCalculated = true;
    render();
}

function togglePower() {
    isOn = !isOn;
    calculatorEl.classList.toggle("off", !isOn);
    powerButton.classList.toggle("on", isOn);

    // 전원 버튼을 뺀 나머지 버튼은 꺼져 있을 때 누를 수 없게 (disabled)
    allButtons.forEach((button) => {
        if (button !== powerButton) button.disabled = !isOn;
    });

    if (isOn) expression = "0";
    justCalculated = false;
    render();
}

//콘솔 계산기 로직과 동일 (곱셈·나눗셈 우선)
function tokenize(text) {
    const tokens = [];
    let numberText = "";

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if ("0123456789.".includes(char)) {
            numberText += char;
            continue;
        }

        if (OPERATORS.includes(char)) {
            const isSign = char === "-" && numberText === "" && (i === 0 || OPERATORS.includes(text[i - 1]));
            if (isSign) {
                numberText = "-";
                continue;
            }
            if (numberText === "" || numberText === "-") throw new Error("연산자 앞에 숫자가 없습니다.");
            tokens.push(Number(numberText), char);
            numberText = "";
            continue;
        }
        throw new Error(`사용할 수 없는 문자: ${char}`);
    }

    if (numberText === "" || numberText === "-") throw new Error("계산식이 연산자로 끝났습니다.");
    tokens.push(Number(numberText));
    return tokens;
}

function calculate(text) {
    const tokens = tokenize(text);

    // 1차 : *, / 먼저
    const stack = [tokens[0]];
    for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const num = tokens[i + 1];
        if (op === "*") stack[stack.length - 1] *= num;
        else if (op === "/") {
            if (num === 0) throw new Error("0으로 나눌 수 없습니다.");
            stack[stack.length - 1] /= num;
        } else stack.push(op, num);
    }

    // 2차 : +, - 왼쪽부터
    let total = stack[0];
    for (let i = 1; i < stack.length; i += 2) {
        total = stack[i] === "+" ? total + stack[i + 1] : total - stack[i + 1];
    }
    return Number(total.toFixed(10)); // 0.1 + 0.2 오차 정리
}

// 이벤트 리스너 연결
buttonArea.addEventListener("click", (event) => {
    const button = event.target.closest("button"); // 버튼 안쪽을 눌러도 버튼을 찾아줌
    if (!button) return;

    const { value, action } = button.dataset; // data-value, data-action 읽기

    if (action === "power") return togglePower();
    if (!isOn) return; // 꺼져 있으면 아무것도 안 함

    if (action === "clear") return clearDisplay();
    if (action === "enter") return performCalculate();
    if (OPERATORS.includes(value)) return appendOperator(value);
    appendNumber(value);
});

// 숫자/연산자/Enter/Backspace/Esc 키로도 조작
document.addEventListener("keydown", (event) => {
    if (!isOn) return;
    const key = event.key;

    let target = null; // 눌린 키와 같은 화면 버튼 (눌림 효과용)

    if ("0123456789.".includes(key) && key !== "") {
        appendNumber(key);
        target = document.querySelector(`[data-value="${key}"]`);
    } else if (OPERATORS.includes(key)) {
        appendOperator(key);
        target = document.querySelector(`[data-value="${key}"]`);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault(); // 포커스된 버튼이 한 번 더 눌리는 것 방지
        performCalculate();
        target = document.querySelector('[data-action="enter"]');
    } else if (key === "Escape" || key.toLowerCase() === "c") {
        clearDisplay();
        target = document.querySelector('[data-action="clear"]');
    } else if (key === "Backspace") {
        deleteLast();
    }

    if (target) {
        target.classList.add("pressed");
        setTimeout(() => target.classList.remove("pressed"), 120);
    }
});

// 처음 화면 그리기
render();
