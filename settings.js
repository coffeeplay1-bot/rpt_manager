export function renderSettingsView() {
    const container = document.getElementById('content-area');
    
    container.innerHTML = `
        <style>
            .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 15px; }
            .section-card { background: #FFFFFF; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #E2E8F0; }
            .section-card h3 { font-size: 16px; font-weight: bold; color: #1E293B; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #F1F5F9; }
            
            /* 📂 그룹 관리 상자 디자인 */
            .group-box { background: #F8FAFC; border-radius: 10px; padding: 12px; margin-bottom: 12px; border: 1px solid #EDF2F7; }
            .group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .group-title { font-size: 14px; font-weight: bold; color: #475569; display: flex; align-items: center; gap: 6px; }
            
            /* 📄 7글자 규격화 미니 배지 레이아웃 */
            .leaf-container { display: flex; flex-wrap: wrap; gap: 6px; padding-left: 4px; }
            .leaf-badge { font-size: 12px; color: #64748B; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
            
            .del-action-btn { background: none; border: none; color: #EF4444; cursor: pointer; font-size: 11px; font-weight: bold; }
            .del-action-btn:hover { text-decoration: underline; }
            .leaf-x { color: #94A3B8; cursor: pointer; font-weight: bold; margin-left: 2px; }
            .leaf-x:hover { color: #EF4444; }
        </style>
        <h2>⚙️ 시스템 통합 데이터 저장소 관리</h2>
        <p style="color:#64748B; margin-bottom: 20px; font-size: 14px;">보관 중인 그룹과 공지 제목의 구조입니다. 각 항목 옆의 삭제 단추로 실시간 파괴가 가능합니다.</p>
        
        <div class="dashboard-grid" id="settings-dashboard"></div>
    `;

    const dashboard = document.getElementById('settings-dashboard');

    const pTabs = JSON.parse(localStorage.getItem('product_tabs')) || [];
    const pNotices = JSON.parse(localStorage.getItem('product_notices')) || {};
    const kFilters = JSON.parse(localStorage.getItem('katalk_filters')) || ['전체', '단독', '홀수일', '짝수일', '기타'];
    const kNotices = JSON.parse(localStorage.getItem('katalk_notices')) || {};

    function limitTo7Chars(str) {
        if (!str) return '제목없음';
        const trimmed = str.trim();
        return trimmed.length > 7 ? trimmed.substring(0, 7) + '...' : trimmed;
    }

    // 📦 [좌측] 상품 안내 보드 카드
    const pCard = document.createElement('div');
    pCard.className = 'section-card';
    pCard.innerHTML = `<h3>📦 화면 노출용 상품 안내</h3>`;
    
    pTabs.forEach(tab => {
        const group = document.createElement('div');
        group.className = 'group-box';
        group.innerHTML = `
            <div class="group-header">
                <span class="group-title">📁 탭: ${tab}</span>
                <button class="del-action-btn" data-type="p-tab" data-key="${tab}">[삭제]</button>
            </div>
            <div class="leaf-container" id="leaf-p-${tab}"></div>
        `;
        pCard.appendChild(group);
    });
    dashboard.appendChild(pCard);

    // 📦 [우측] 카톡 안내 보드 카드
    const kCard = document.createElement('div');
    kCard.className = 'section-card';
    kCard.innerHTML = `<h3>💬 오픈채팅방용 카톡 안내</h3>`;
    
    kFilters.forEach(filter => {
        const group = document.createElement('div');
        group.className = 'group-box';
        const fixLabel = filter === '전체' ? `<span style="color:#94A3B8; font-size:11px;">(고정값)</span>` : `<button class="del-action-btn" data-type="k-filter" data-key="${filter}">[삭제]</button>`;
        group.innerHTML = `
            <div class="group-header">
                <span class="group-title">🏷️ 구분: ${filter}</span>
                ${fixLabel}
            </div>
            <div class="leaf-container" id="leaf-k-${filter}"></div>
        `;
        kCard.appendChild(group);
    });
    dashboard.appendChild(kCard);

    // 각 그룹의 7글자 요약 공지 배지들을 안전하게 바인딩 주입 (깨짐 방지)
    pTabs.forEach(tab => {
        const box = document.getElementById(`leaf-p-${tab}`);
        if (pNotices[tab]) {
            pNotices[tab].forEach((item, idx) => {
                const badge = document.createElement('span');
                badge.className = 'leaf-badge';
                badge.innerText = `📄 ` + limitTo7Chars(item.title);
                badge.innerHTML += ` <span class="leaf-x" data-type="p-notice" data-key="${tab}" data-idx="${idx}">✕</span>`;
                box.appendChild(badge);
            });
        }
    });

    kFilters.forEach(filter => {
        const box = document.getElementById(`leaf-k-${filter}`);
        if (kNotices[filter]) {
            const sorted = [...kNotices[filter]].sort((a,b) => (a.title||'').localeCompare(b.title||'','ko'));
            sorted.forEach((item) => {
                const oriIdx = kNotices[filter].findIndex(n => n.title === item.title && n.content === item.content);
                const badge = document.createElement('span');
                badge.className = 'leaf-badge';
                badge.innerText = `📄 ` + limitTo7Chars(item.title);
                badge.innerHTML += ` <span class="leaf-x" data-type="k-notice" data-key="${filter}" data-idx="${oriIdx}">✕</span>`;
                box.appendChild(badge);
            });
        }
    });

    // 통합 삭제 제어 이벤트 리스너
    dashboard.addEventListener('click', (e) => {
        const isBtn = e.target.classList.contains('del-action-btn');
        const isX = e.target.classList.contains('leaf-x');
        if (!isBtn && !isX) return;

        const type = e.target.getAttribute('data-type');
        const key = e.target.getAttribute('data-key');
        const idx = e.target.getAttribute('data-idx');

        if (!confirm('정말 삭제하시겠습니까?')) return;

        if (type === 'p-tab') {
            const tabs = pTabs.filter(t => t !== key);
            delete pNotices[key];
            localStorage.setItem('product_tabs', JSON.stringify(tabs));
            localStorage.setItem('product_notices', JSON.stringify(pNotices));
        } else if (type === 'p-notice') {
            pNotices[key].splice(Number(idx), 1);
            localStorage.setItem('product_notices', JSON.stringify(pNotices));
        } else if (type === 'k-filter') {
            if (key === '전체') return;
            const filters = kFilters.filter(f => f !== key);
            delete kNotices[key];
            localStorage.setItem('katalk_filters', JSON.stringify(filters));
            localStorage.setItem('katalk_notices', JSON.stringify(kNotices));
        } else if (type === 'k-notice') {
            kNotices[key].splice(Number(idx), 1);
            localStorage.setItem('katalk_notices', JSON.stringify(kNotices));
        }
        renderSettingsView();
    });
}
