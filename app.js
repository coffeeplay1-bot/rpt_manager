import { renderProductView } from './product.js';
import { renderKatalkView } from './katalk.js';
import { renderSettingsView } from './settings.js';

// 🎯 구글 파이어베이스 주소 설정 (질문자님의 진짜 Key 데이터 구조를 그대로 유지하세요!)
const firebaseConfig = {
  apiKey: "AIzaSyDWMoeASRf3LXY0gMhs2DXQ1sk-6ZGtSZA",
  authDomain: "rpt-count.firebaseapp.com",
  projectId: "rpt-count",
  storageBucket: "rpt-count.firebasestorage.app",
  messagingSenderId: "40155260698",
  appId: "1:40155260698:web:30c85be69a212c06deeea3",
  measurementId: "G-610J4FSRRJ"
};



// 🎯 앱 전체에서 공유할 글로벌 데이터베이스 인스턴스 (초기값 null 안전 잠금)
export let db = null;

// 파이어베이스 엔진이 브라우저에 착륙할 때까지 안전하게 대기 서칭하는 엔진
function startSystemEngine() {
    if (window.firebase) {
        try {
            window.firebase.initializeApp(firebaseConfig);
            db = window.firebase.firestore();
            console.log("구글 클라우드 데이터 창고가 연결되었습니다.");
        } catch (e) {
            console.warn("구글 클라우드 인증 실패: 로컬 독립 모드로 자동 강제 전환되었습니다.");
        }
    } else {
        console.warn("파이어베이스 라이브러리가 확인되지 않아 안전 로컬 모드로 준비합니다.");
    }
    
    // 🎯 [핵심 보정] 클라우드가 연결되든 실패하든, 메뉴 작동을 위해 무조건 첫 화면을 그려 마비를 차단합니다!
    renderProductView();
}

document.addEventListener('DOMContentLoaded', () => {
    const menuProduct = document.getElementById('menu-product');
    const menuKatalk = document.getElementById('menu-katalk');
    const menuSettings = document.getElementById('menu-settings');

    // 🎯 [핵심 보정] 데이터 로드가 덜 되었더라도 메뉴 전환 버튼 클릭은 무조건 선행 작동하도록 분리 보정
    function switchMenu(activeBtn, renderFn) {
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
        renderFn();
    }

    if (menuProduct) menuProduct.addEventListener('click', () => switchMenu(menuProduct, renderProductView));
    if (menuKatalk) menuKatalk.addEventListener('click', () => switchMenu(menuKatalk, renderKatalkView));
    if (menuSettings) menuSettings.addEventListener('click', () => switchMenu(menuSettings, renderSettingsView));

    // 파이어베이스 로딩 상태 체크 엔진 안전 점화
    setTimeout(startSystemEngine, 100);
});

export function openModal(htmlContent) {
    const modal = document.getElementById('global-modal');
    if(modal) { modal.innerHTML = htmlContent; modal.style.display = 'flex'; }
}
export function closeModal() {
    const modal = document.getElementById('global-modal');
    if(modal) modal.style.display = 'none';
}
