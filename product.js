import { openModal, closeModal, db } from './app.js';

const pastelColors = ['#E3F2FD', '#FFF3E0', '#E8F5E9', '#F3E5F5', '#FFE5D9', '#FCE4EC'];
const colorMap = { '예약 확정': '#E3F2FD', '상품 안내': '#FFF3E0' };

function getProductPastelColor(seed, index) {
    if (colorMap[seed]) return colorMap[seed];
    return pastelColors[index % pastelColors.length];
}

export async function renderProductView() {
    const container = document.getElementById('content-area');
    if (!container) return;

    // 기본 로컬 방어벽 데이터 세팅
    let tabs = ['예약 확정', '상품 안내'];
    let notices = { '예약 확정': [], '상품 안내': [] };

    // 🎯 클라우드 창고에서 원격 데이터 추출
    if (db) {
        try {
            const sysDoc = await db.collection('system').doc('storage').get();
            if (sysDoc.exists) {
                const serverData = sysDoc.data() || {};
                if (serverData.product_tabs) tabs = serverData.product_tabs;
                if (serverData.product_notices) notices = serverData.product_notices;
            }
        } catch (err) {
            console.warn("로컬 모드 우회 가동 중");
        }
    }
    
    let activeTab = localStorage.getItem('current_product_active_tab');
    if (!activeTab || !tabs.includes(activeTab)) {
        activeTab = tabs[0] || '';
        localStorage.setItem('current_product_active_tab', activeTab);
    }

    container.innerHTML = `
        <div class="layout-wrapper">
            <div class="left-area">
                <div class="tab-row" id="tab-headers"></div>
                <div class="action-row"><button class="main-btn" id="add-prod-notice-btn">공지 추가</button></div>
                <div class="msg-box-list" id="prod-nametag-list"></div>
            </div>
            <div class="simulator">
                <div class="sim-header">마이리얼트립 상담방 미리보기</div>
                <div class="sim-body"><div class="mrt-bubble-right" id="mrt-live-bubble"></div></div>
                <div class="footer-mock">
                    <span style="font-size:18px; color:#CBD5E1; font-weight:bold;">＋</span>
                    <div class="input-mock">메시지를 입력해주세요.</div>
                    <span class="send-mock" style="color:#4AA0E6;">▲</span>
                </div>
            </div>
        </div>
    `;

    const tabHeaders = document.getElementById('tab-headers');
    tabs.forEach((tab, idx) => {
        const tabEl = document.createElement('button');
        tabEl.className = 'sub-tab' + (tab === activeTab ? ' active' : '');
        tabEl.innerText = tab;
        tabEl.style.backgroundColor = getProductPastelColor(tab, idx);
        
        const delBtn = document.createElement('span');
        delBtn.className = 'tab-del-btn'; delBtn.innerText = ' ✕';
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`'${tab}' 탭을 삭제하시겠습니까?`)) {
                const updatedTabs = tabs.filter(t => t !== tab);
                delete notices[tab];
                if (db) { try { await db.collection('system').doc('storage').update({ product_tabs: updatedTabs, product_notices: notices }); } catch(err){} }
                renderProductView();
            }
        };
        tabEl.appendChild(delBtn);
        tabEl.onclick = () => { localStorage.setItem('current_product_active_tab', tab); renderProductView(); };
        tabHeaders.appendChild(tabEl);
    });

    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'sub-tab'; addTabBtn.style.backgroundColor = '#ECEFF1'; addTabBtn.innerText = '+';
    addTabBtn.onclick = () => showAddTabModal(tabs, notices);
    tabHeaders.appendChild(addTabBtn);

    const listArea = document.getElementById('prod-nametag-list');
    const bubbleMirror = document.getElementById('mrt-live-bubble');
    const currentList = notices[activeTab] || [];

    if (currentList.length > 0) {
        bubbleMirror.innerText = currentList[0].content;
        currentList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'msg-box' + (index === 0 ? ' selected-target' : '');
            card.innerHTML = `
                <div class="window-header">
                    <div class="window-title-area">${item.isMain ? '<span style="background:#EF4444; color:white; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:bold; margin-right:4px;">메인</span>' : ''}📌 <strong class="title-txt" style="font-size:14px;"></strong></div>
                    <button class="window-close-x">✕</button>
                </div>
                <div style="font-size:14px; color:#475569; white-space:pre-wrap; line-height:1.6; background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:10px;"></div>
                <div class="bottom-actions"><button class="icon-copy-btn">📋 복사</button></div>
            `;
            card.querySelector('.title-txt').innerText = item.title || '제목 없음';
            card.querySelector('div:nth-child(2)').innerText = item.content;

            card.onclick = (e) => {
                if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn')) return;
                document.querySelectorAll('.msg-box').forEach(b => b.classList.remove('selected-target'));
                card.classList.add('selected-target');
                bubbleMirror.innerText = item.content;
            };

            card.querySelector('.icon-copy-btn').onclick = () => { navigator.clipboard.writeText(item.content).then(() => alert('공지가 복사되었습니다.')); };
            card.querySelector('.window-close-x').onclick = async () => {
                if (confirm(`'${item.title || '선택한'}' 공지를 삭제할까요?`)) {
                    notices[activeTab].splice(index, 1);
                    if (db) { try { await db.collection('system').doc('storage').update({ product_notices: notices }); } catch(err){} }
                    renderProductView();
                }
            };
            listArea.appendChild(card);
        });
    } else {
        listArea.innerHTML = '<p style="color:#94A3B8; font-size:13px; padding:10px;">등록된 공지가 없습니다.</p>';
        bubbleMirror.innerText = "공지를 선택하시면 실제 줄바꿈 상태가 여기에 표시됩니다.";
    }

    document.getElementById('add-prod-notice-btn').onclick = () => showAddNoticeModal(activeTab, notices, tabs);
}

function showAddTabModal(tabs, notices) {
    const html = `<div class="modal-content"><button class="modal-close" id="close-modal">✕</button><h3>📁 새로운 안내 탭 추가</h3><input type="text" id="new-tab-name" placeholder="탭 이름 입력"><button class="modal-submit" id="submit-tab">확인</button></div>`;
    openModal(html); document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-tab').onclick = async () => {
        const name = document.getElementById('new-tab-name').value.trim();
        if (!name || tabs.includes(name)) return alert('올바르지 않거나 중복된 이름입니다.');
        tabs.push(name); notices[name] = [];
        if (db) { try { await db.collection('system').doc('storage').set({ product_tabs: tabs, product_notices: notices }, { merge: true }); } catch(e){} }
        localStorage.setItem('current_product_active_tab', name); closeModal(); renderProductView();
    };
}

function showAddNoticeModal(tabName, notices, tabs) {
    const html = `<div class="modal-content"><button class="modal-close" id="close-modal">✕</button><h3>📝 [${tabName}] 공지 등록</h3><div style="margin-bottom:12px; display:flex; align-items:center; gap:6px;"><input type="checkbox" id="notice-main-check" style="width:auto; margin:0;"><label for="notice-main-check" style="font-size:14px; font-weight:bold; color:#EF4444; cursor:pointer;">⭐ 메인 공지 지정</label></div><input type="text" id="notice-title" placeholder="안내 제목"><textarea id="notice-content" placeholder="상세 내용 입력"></textarea><button class="modal-submit" id="submit-notice">추가</button></div>`;
    openModal(html); document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-notice').onclick = async () => {
        const title = document.getElementById('notice-title').value.trim();
        const content = document.getElementById('notice-content').value.trim();
        const isMain = document.getElementById('notice-main-check').checked;
        if (!title || !content) return alert('모두 입력해 주세요.');

        if (!notices[tabName]) notices[tabName] = [];
        const newNotice = { title, content, isMain };
        if (isMain) notices[tabName].unshift(newNotice);
        else notices[tabName].push(newNotice);

        // 🎯 [등록 버그 해결] 원격 클라우드 서버 강제 오버라이드 병합 업데이트 처리
        if (db) {
            try { 
                await db.collection('system').doc('storage').set({ 
                    product_tabs: tabs, 
                    product_notices: notices 
                }, { merge: true }); 
            } catch(err){ console.error("서버 전송 오류:", err); }
        }
        closeModal(); renderProductView();
    };
}
