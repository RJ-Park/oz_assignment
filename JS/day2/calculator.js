// 문자열 계산식을 "토큰(조각)" 배열로 나누기
function tokenize(expression) {
    const tokens = [];
    const text = expression.replace(/\s/g, ""); // 공백 모두 제거
    let numberText = "";                          // 숫자를 한 글자씩 모으는 변수

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 숫자 또는 소수점이면 numberText 에 이어 붙이기
        if ("0123456789.".includes(char)) {
            numberText += char;
            continue;
        }

        if ("+-*/".includes(char)) {
            // '-' 가 맨 앞이거나 연산자 바로 뒤에 오면 "음수 부호"처리
            const prev = text[i - 1];
            const isSign = char === "-" && numberText === "" && (i === 0 || "+-*/".includes(prev));
            if (isSign) {
                numberText = "-";
                continue;
            }

            if (numberText === "" || numberText === "-") {
                throw new Error(`'${char}' 앞에 숫자가 없습니다.`);
            }
            tokens.push(toNumber(numberText));
            tokens.push(char);
            numberText = "";
            continue;
        }

        throw new Error(`사용할 수 없는 문자입니다: '${char}'`);
    }

    if (numberText === "" || numberText === "-") {
        throw new Error("계산식이 연산자로 끝났습니다.");
    }
    tokens.push(toNumber(numberText));
    return tokens;
}

// 문자열 → 숫자 변환 (잘못된 숫자 "1.2.3" 등을 걸러냄)
function toNumber(text) {
    const value = Number(text);
    if (Number.isNaN(value)) {
        throw new Error(`숫자 형식이 잘못되었습니다: '${text}'`);
    }
    return value;
}

// 곱셈/나눗셈 먼저 계산 (1차 순회)
function calculateMulDiv(tokens) {
    const result = [tokens[0]];

    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const nextNumber = tokens[i + 1];

        if (operator === "*") {
            result[result.length - 1] = result[result.length - 1] * nextNumber;
        } else if (operator === "/") {
            if (nextNumber === 0) {
                throw new Error("0으로 나눌 수 없습니다.");
            }
            result[result.length - 1] = result[result.length - 1] / nextNumber;
        } else {
            // + 또는 - 는 나중에 계산하도록 그대로 넘깁니다.
            result.push(operator, nextNumber);
        }
    }
    return result;
}

// 덧셈/뺄셈 계산 (2차 순회, 왼쪽 → 오른쪽)
function calculateAddSub(tokens) {
    let total = tokens[0];

    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const nextNumber = tokens[i + 1];

        if (operator === "+") total += nextNumber;
        if (operator === "-") total -= nextNumber;
    }
    return total;
}

// 위 함수들을 순서대로 연결
function calculate(expression) {
    const tokens = tokenize(expression);
    const afterMulDiv = calculateMulDiv(tokens);
    const total = calculateAddSub(afterMulDiv);

    // 0.1 + 0.2 = 0.30000000000000004 같은 부동소수점 오차를 보기 좋게 정리
    return Number(total.toFixed(10));
}

// 콘솔에서 실행할 start() 함수
function start() {
    console.log("%c🧮 콘솔 계산기를 시작합니다. (종료: 취소 버튼 또는 exit)", "color:#7b00ff;font-weight:bold");

    while (true) {
        const input = prompt("계산식을 입력하세요. (예: 1 + 2 * 3 - 4 / 2)\n종료하려면 취소 또는 exit");

        if (input === null || input.trim() === "" || input.trim().toLowerCase() === "exit") {
            console.log("계산기를 종료합니다. 👋");
            break;
        }

        try {
            const result = calculate(input);
            console.log(`${input} = ${result}`);
            alert(`결과: ${input} = ${result}`);
        } catch (error) {
            console.error(`⚠️ ${error.message}`);
            alert(`오류: ${error.message}`);
        }
    }
}

// 페이지가 열리면 콘솔에 사용법 안내
console.log("👉 콘솔에 start() 를 입력하면 계산기가 실행됩니다.");
console.log("👉 prompt 없이 바로 쓰려면 calculate(\"1 + 2 * 3\") 처럼 입력해도 됩니다.");
