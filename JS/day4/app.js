// 설정값 & DOM 요소
const API_URL = "https://api4.binance.com/api/v3/ticker/24hr";
const REFRESH_MS = 1000;            // 1초마다 갱신
const STORAGE_KEY = "favorites";    // localStorage 에 저장할 이름(key)

const coinList = document.querySelector("#coin-list");
const searchInput = document.querySelector("#search");
const statusText = document.querySelector("#status");
const tabButtons = document.querySelectorAll(".tab");
const favCount = document.querySelector("#fav-count");

// 상태(state)
let coins = [];                 // API 에서 받은 USDT 코인 목록
let previousPrices = {};        // 직전 가격 { BTCUSDT: 76961.41, ... } → 깜빡임 효과용
let currentTab = "all";         // "all" | "favorites"
let favorites = loadFavorites(); // 관심항목 심볼 배열 ["BTCUSDT", ...]
let isFetching = false;         // 이전 요청이 아직 안 끝났으면 새 요청을 보내지 않음

// 관심항목 저장/불러오기
function loadFavorites() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.warn("관심항목을 불러오지 못했습니다:", error);
        return [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.warn("관심항목을 저장하지 못했습니다:", error);
    }
}

function toggleFavorite(symbol) {
    if (favorites.includes(symbol)) {
        favorites = favorites.filter((item) => item !== symbol); // 제거
    } else {
        favorites.push(symbol); // 추가
    }
    saveFavorites();
    render();
}

// 바이낸스 서버에서 시세 받아오기
async function fetchPrices() {
    if (isFetching) return; // 응답이 1초보다 늦으면 요청이 쌓이지 않게 건너뜀
    isFetching = true;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json(); // 응답 본문(JSON) → JS 배열

        // 현재 coins 의 가격을 previousPrices 로 옮겨두고 새 데이터로 교체
        previousPrices = Object.fromEntries(coins.map((c) => [c.symbol, c.lastPrice]));

        coins = data
            .filter((item) => item.symbol.endsWith("USDT"))   // USDT 항목만
            .filter((item) => Number(item.lastPrice) > 0)     // 거래 중단(가격 0) 항목 제외
            .map((item) => ({
                symbol: item.symbol,
                lastPrice: Number(item.lastPrice),
                changePercent: Number(item.priceChangePercent),
                highPrice: Number(item.highPrice),
                lowPrice: Number(item.lowPrice),
            }));

        statusText.classList.remove("error");
        render();
    } catch (error) {
        console.error("시세 요청 실패:", error);
        statusText.textContent = "⚠️ 서버에 연결하지 못했습니다. 1초 후 다시 시도합니다.";
        statusText.classList.add("error");
    } finally {
        isFetching = false;
    }
}

// 화면 그리기
const formatPrice = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 8 });

function render() {
    const keyword = searchInput.value.trim().toUpperCase();

    // 탭 + 검색어로 걸러내기
    const visible = coins.filter((coin) => {
        if (currentTab === "favorites" && !favorites.includes(coin.symbol)) return false;
        return coin.symbol.includes(keyword);
    });

    // 행(tr) HTML 만들기
    if (visible.length === 0) {
        const message = currentTab === "favorites" && favorites.length === 0
            ? "아직 관심항목이 없습니다. ☆ 를 눌러 추가해 보세요."
            : "검색 결과가 없습니다.";
        coinList.innerHTML = `<tr><td colspan="6" class="empty">${message}</td></tr>`;
    } else {
        coinList.innerHTML = visible.map(createRow).join("");
    }

    // 상태 표시
    favCount.textContent = favorites.length;
    if (!statusText.classList.contains("error") && coins.length > 0) {
        const time = new Date().toLocaleTimeString("ko-KR");
        statusText.textContent = `마지막 업데이트 ${time} · ${visible.length}개 표시 중`;
    }
}

function createRow(coin) {
    const isFav = favorites.includes(coin.symbol);
    const changeClass = coin.changePercent >= 0 ? "up" : "down";
    const sign = coin.changePercent > 0 ? "+" : "";

    // 직전 가격과 비교해서 올랐으면 빨강, 내렸으면 파랑으로 잠깐 깜빡임
    const before = previousPrices[coin.symbol];
    let flash = "";
    if (before !== undefined && before !== coin.lastPrice) {
        flash = coin.lastPrice > before ? "flash-up" : "flash-down";
    }

    return `
        <tr>
            <td><button class="star ${isFav ? "on" : ""}" data-symbol="${coin.symbol}"
                aria-label="${coin.symbol} 관심항목 ${isFav ? "해제" : "추가"}">${isFav ? "★" : "☆"}</button></td>
            <td class="symbol">${coin.symbol}</td>
            <td class="num ${flash}">${formatPrice(coin.lastPrice)}</td>
            <td class="num ${changeClass}">${sign}${coin.changePercent.toFixed(2)}%</td>
            <td class="num">${formatPrice(coin.highPrice)}</td>
            <td class="num">${formatPrice(coin.lowPrice)}</td>
        </tr>`;
}

// 별 버튼
coinList.addEventListener("click", (event) => {
    const star = event.target.closest(".star");
    if (star) toggleFavorite(star.dataset.symbol);
});

// 검색
searchInput.addEventListener("input", render);

// 탭 전환
tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        currentTab = button.dataset.tab;
        render();
    });
});

// 바로 한 번 요청하고, 이후 1초마다 반복 (Timer API)
fetchPrices();
setInterval(fetchPrices, REFRESH_MS);
