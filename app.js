import { renderProductView } from './product.js';
import { renderKatalkView } from './katalk.js';
import { renderOpenChatView } from './openchat.js'; 

// 🎯 [최적화] 기존에 불필요하게 자리를 차지하던 settings.js 임포트 구문을 완전히 삭제했습니다.

const firebaseConfig = {
  apiKey: "AIzaSyDWMoeASRf3LXY0gMhs2DXQ1sk-6ZGtSZA",
  authDomain: "://firebaseapp.com",
  projectId: "rpt-count",
  storageBucket: "rpt-count.firebasestorage.app",
  messagingSenderId: "40155260698",
  appId: "1:40155260698:web:30c85be69a212c06deeea3",
  measurementId: "G-610J4FSRRJ"
};

export let db = null;

function startSystemEngine() {
    if (window.firebase) {
        try {
            window.firebase.initializeApp(firebaseConfig);
            db = window.firebase.firestore();
            console.log("구글 클라우드 데이터 창고가 연결되었습니다.");
        } catch (e) {
            console.warn("구글 클라우드 인증 실패: 로컬 독립 모드로 전환.");
        }
    } else {
        console.warn("파이어베이스 라이브러리 미확인: 로컬 모드 준비.");
    }
    
    renderProductView();
}


document.addEventListener('DOMContentLoaded', () => {
    const menuProduct = document.getElementById('menu-product');
    const menuKatalk = document.getElementById('menu-katalk');
    const menuOpenChat = document.getElementById('menu-openchat');
    const menuCalc = document.getElementById('menu-calc');
    // 🎯 [최적화] 설정 버튼(menuSettings) 관련 변수 선언을 완벽하게 제거했습니다.
    const allBtns = [menuProduct, menuKatalk, menuOpenChat, menuCalc];

    // 사이드바 블루 활성화 하이라이트 제어 장치
    function switchMenu(activeBtn, renderFn) {
        allBtns.forEach(btn => { if(btn) btn.classList.remove('active'); });
        if(activeBtn) activeBtn.classList.add('active');
        renderFn();
    }

    // 1. 📦 상품 안내 버튼 이벤트
    if (menuProduct) menuProduct.addEventListener('click', () => switchMenu(menuProduct, renderProductView));
    
    // 2. 💬 카톡 안내 버튼 이벤트
    if (menuKatalk) {
        menuKatalk.addEventListener('click', () => {
            localStorage.setItem('katalk_main_tab', 'katalk');
            switchMenu(menuKatalk, renderKatalkView);
        });
    }

    // 3. 💛 오픈채팅방 관리 버튼 이벤트
    if (menuOpenChat) {
        menuOpenChat.addEventListener('click', () => {
            localStorage.setItem('katalk_main_tab', 'openchat');
            switchMenu(menuOpenChat, renderOpenChatView);
        });
    }

    // 4. 🧮 계산기 기능 버튼 이벤트
    if (menuCalc) {
        menuCalc.addEventListener('click', () => {
            localStorage.setItem('katalk_main_tab', 'calc');
            switchMenu(menuCalc, renderKatalkView);
        });
    }

    // 🎯 [최적화] 기존에 설정 버튼을 감시하던 설정 클릭 이벤트 핸들러를 완전히 전면 삭제했습니다.

    // 시스템 엔진 가동
    setTimeout(startSystemEngine, 100);
});

// 공용 팝업 모달창 제어 인프라
export function openModal(htmlContent) {
    const modal = document.getElementById('global-modal');
    if(modal) { modal.innerHTML = htmlContent; modal.style.display = 'flex'; }
}
export function closeModal() {
    const modal = document.getElementById('global-modal');
    if(modal) modal.style.display = 'none';
}
