// 🎯 product.js 맨 위 첫 줄부터 container.innerHTML 시작 직전까지만 딱 찾아서 교체해 주세요!
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

    let tabs = ['예약 확정', '상품 안내'];
    let notices = { '예약 확정': [], '상품 안내': [] };

    if (db) {
        try {
            const sysDoc = await db.collection('system').doc('storage').get();
            if (sysDoc.exists) {
                const serverData = sysDoc.data() || {};
                if (serverData.product_tabs) tabs = serverData.product_tabs;
                // 🎯 [완벽 복구] 유실되었던 데이터 대입 명세를 정확하게 고정 매핑 완료했습니다!
                if (serverData.product_notices) notices = serverData.product_notices;
            }
        } catch (err) { console.warn("로컬 모드 우회 가동 중"); }
    }
    
    let activeTab = localStorage.getItem('current_product_active_tab');
    if (!activeTab || !tabs.includes(activeTab)) {
        activeTab = tabs[0] || '';
        localStorage.setItem('current_product_active_tab', activeTab);
    }


    // 🎯 [최종 결전 무적의 솔루션] 브라우저 body 전체와 메인 컨테이너 레이어의 z-index 및 3차원 공중 부양 속성을 뿌리째 뽑아버리는 초강력 긴급 스타일시트 돔 주입
    container.innerHTML = `
        <!-- 💡 외부 style.css나 다른 파일이 억지로 띄워놓은 레이어를 강제로 지면에 안착시키는 절대 파괴 서식 주입 -->
        <style>
            /* 1. 브라우저 본체와 메인 콘텐츠 상자의 강제 3차원 분리 파괴 및 패딩 리셋 */
            body, html { display: flex !important; width: 100% !important; max-width: 100% !important; overflow-x: auto !important; }
            #content-area, .main-container { 
                display: block !important;
                position: relative !important; /* fixed, absolute 공중부양을 강제 삭제 */
                width: 100% !important; 
                max-width: 100% !important; 
                min-width: 1300px !important;
                padding: 20px !important; 
                margin: 0 !important;
                box-sizing: border-box !important; 
                z-index: 1 !important;
            }
            
            /* 2. 두 대지를 감싸는 메인 틀이 겹치지 않게 가로로 나란히 고정 고착 */
            .layout-wrapper { 
                display: flex !important; 
                flex-direction: row !important; 
                gap: 24px !important; 
                align-items: flex-start !important; 
                width: 100% !important; 
                max-width: 100% !important; 
                box-sizing: border-box !important; 
                flex-wrap: nowrap !important;
                position: relative !important;
                z-index: 5 !important;
            }
            
            /* 3. 왼쪽 3열 대지가 무조건 미리보기 경계선 왼쪽까지만 넓어지도록 강제 삭감 배정 */
            .left-area { 
                flex: 1 !important; 
                display: flex !important; 
                flex-direction: column !important; 
                gap: 12px !important; 
                box-sizing: border-box !important;
                min-width: 760px !important;
                width: calc(100% - 530px) !important;
                max-width: calc(100% - 530px) !important;
                position: relative !important;
                z-index: 10 !important;
            }
            
            /* 4. 대망의 3열 격자 네임카드 정렬 서식 고정 */
            #prod-nametag-list { 
                display: grid !important; 
                grid-template-columns: 1fr 1fr 1fr !important; 
                gap: 10px !important; 
                align-items: start !important; 
                width: 100% !important; 
                box-sizing: border-box !important; 
            }
            
            /* 5. [결정타] 혼자 다른 레이어 위로 붕 떠서 가리던 시뮬레이터 창의 공중 부양(absolute/fixed) 사양을 완벽하게 파괴하고 평면 안착! */
            .simulator { 
                position: relative !important; /* 👈 absolute/fixed 스티커 레이어를 파괴하고 3열 대지와 똑같은 평면 지면에 안착시키는 핵심 스위치 */
                top: 0 !important; 
                left: 0 !important;
                margin: 0 !important;
                width: 500px !important; 
                height: 700px !important; 
                flex-shrink: 0 !important; 
                background: #FFFFFF !important; 
                border-radius: 16px !important; 
                box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important; 
                border: 1px solid #E2E8F0 !important; 
                display: flex !important; 
                flex-direction: column !important; 
                overflow: hidden !important; 
                box-sizing: border-box !important; 
                z-index: 10 !important; /* 👈 3열 레이어와 똑같은 수평선상 높이로 동기화 마감 */
            }
        </style>

        <div class="layout-wrapper">
            <!-- 🎯 왼쪽 3열 대지 구역 -->
            <div class="left-area">
                <div class="tab-row" id="tab-headers"></div>
                <div class="action-row"><button class="main-btn" id="add-prod-notice-btn">공지 추가</button></div>
                <div class="msg-box-list" id="prod-nametag-list"></div>
            </div>
            
            <!-- 🎯 우측 마이리얼트립 미리보기 구역 -->
            <div class="simulator">
                <div class="sim-header">마이리얼트립 상담방 미리보기</div>
                <div class="sim-body">
                    <div class="mrt-bubble-right" id="mrt-live-bubble" style="font-size:15px; line-height:1.6; box-sizing:border-box;">공지를 선택하시면 실제 줄바꿈 상태가 여기에 표시됩니다.</div>
                </div>
                <div class="footer-mock">
                    <span style="font-size:18px; color:#CBD5E1; font-weight:bold;">＋</span>
                    <div class="input-mock">메시지를 입력해주세요.</div>
                    <span class="send-mock" style="font-size:16px; font-weight:bold; color:#4AA0E6; cursor:pointer; box-sizing:border-box;">▲</span>
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

    // product.js 파일 중간의 const listArea = document.getElementById('prod-nametag-list'); 부근부터 교체해 주세요!
    const listArea = document.getElementById('prod-nametag-list');
    
    // 🎯 [요구사항 1] 가로 2열에서 '가로 3열(1fr 1fr 1fr)' 격자 배선 구조로 전면 확장 개편
    listArea.style = 'display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; align-items: start; width:100%; box-sizing:border-box;';
    
    const bubbleMirror = document.getElementById('mrt-live-bubble');
    
    // 🎯 [요구사항 2] 우측 마이리얼트립 미리보기 화면(시뮬레이터)의 전체 수직 높이를 550px에서 700px로 과감하게 수직 확장
    const simFrame = document.querySelector('.simulator');
    if (simFrame) {
        simFrame.style.height = '700px';
    }

    const currentList = notices[activeTab] || [];

    if (currentList.length > 0) {
        if (currentList[0]) bubbleMirror.innerText = currentList[0].content;
        
        currentList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'msg-box' + (index === 0 ? ' selected-target' : '');
            card.style = 'padding:12px; margin:0; border:none; border-radius:10px; background:#FFFFFF; box-shadow:0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02); font-size:12px; box-sizing:border-box; transition:all 0.2s; width:100%;';
            
            // 🎯 [요구사항 3] 카드 본문 높이를 조금 줄이고(220px ➔ 150px), 먹통이었던 안쪽 스크롤바 작동을 방해하던 pointer-events: none을 제거하여 완벽하게 살려냈습니다!
            card.innerHTML = `
                <div class="window-header" style="padding-bottom:4px; margin-bottom:4px; border-bottom:none; pointer-events:none; display:flex; align-items:center; width:100%; justify-content:space-between; gap:6px;">
                    <div class="window-title-area" style="display:flex; align-items:center; white-space:nowrap; flex:1; overflow:hidden; gap:4px;">
                        ${item.isMain ? '<span style="background:#EF4444; color:white; font-size:10.5px; padding:1.5px 5px; border-radius:4px; font-weight:bold; flex-shrink:0; line-height:1.2;">메인</span>' : ''}
                        📌 <strong class="title-txt" style="font-size:13.5px; color:#1E293B; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></strong>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                        <button class="edit-prod-card-btn" style="font-size:11px; pointer-events:auto; padding:2px; background:none; border:none; cursor:pointer; transition:0.15s;" title="공지 수정">✏️</button>
                        <button class="window-close-x" style="font-size:11px; pointer-events:auto; padding:2px;">✕</button>
                    </div>
                </div>
                <!-- 🎯 pointer-events: auto 스위치 변환 완료! 이제 내용 박스를 마우스 스크롤로 직접 움직여 끝까지 탐독할 수 있습니다. -->
                <div class="prod-content-area" style="font-size:11.5px; color:#475569; white-space:pre-wrap; line-height:1.5; background:#F8FAFC; padding:10px; border-radius:6px; margin-bottom:6px; height:150px; overflow-y:auto; pointer-events:auto;"></div>
                <div class="bottom-actions" style="display:flex; justify-content:flex-end; margin-top:2px; pointer-events:auto;">
                    <button class="icon-copy-btn" style="display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:bold; padding:4px 10px; background-color:#E1F0FF; color:#1E40AF; border:1px solid #93C5FD; border-radius:6px; cursor:pointer;">📋 복사</button>
                </div>
            `;
            
            card.querySelector('.title-txt').innerText = item.title || '제목 없음';
            card.querySelector('.prod-content-area').innerText = item.content;

            // product.js 파일 중간의 card.onclick = (e) => { ... }; 블록만 딱 찾아서 이 코드로 교체해 주세요!
            card.onclick = (e) => {
                // 🎯 [해결] 차단 조건에서 'prod-content-area'를 완전히 삭제하여 안쪽 박스를 클릭해도 미리보기가 즉시 가동됩니다!
                if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn') || e.target.classList.contains('edit-prod-card-btn')) return;
                
                // 네임카드 활성화 블루 하이라이트 테두리 이동 처리
                document.querySelectorAll('#prod-nametag-list .msg-box').forEach(b => b.classList.remove('selected-target'));
                card.classList.add('selected-target');
                
                // 🎯 안쪽 회색 본문 영역 위를 클릭해도 우측 미리보기 보드에 실제 줄바꿈 내용이 자석처럼 즉각 출력됩니다.
                bubbleMirror.innerText = item.content;
            };


            card.querySelector('.icon-copy-btn').onclick = (e) => { 
                e.stopPropagation();
                navigator.clipboard.writeText(item.content).then(() => alert('공지가 복사되었습니다.')); 
            };
            
            card.querySelector('.edit-prod-card-btn').onclick = (e) => {
                e.stopPropagation();
                showEditProductNoticeModal(activeTab, notices, item, tabs);
            };
            card.querySelector('.window-close-x').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`'${item.title || '선택한'}' 공지를 삭제할까요?`)) {
                    notices[activeTab].splice(index, 1);
                    if (db) { try { await db.collection('system').doc('storage').update({ product_notices: notices }); } catch(err){} }
                    renderProductView();
                }
            };
            listArea.appendChild(card);
        });
    } else {
        listArea.removeAttribute('style');
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


// 🎯 product.js 파일 가장 맨 밑바닥 마지막 줄에 공백 없이 이어서 붙여넣어 완료하세요!
function showEditProductNoticeModal(activeTab, notices, originItem, tabs) {
    const origIdx = notices[activeTab].findIndex(n => n.title === originItem.title && n.content === originItem.content);
    if (origIdx === -1) return alert('원본 데이터를 찾을 수 없습니다.');

    openModal(`
        <div class="modal-content">
            <button class="modal-close" id="close-modal">✕</button>
            <h3>✏️ 상품 공지사항 수정</h3>
            <div style="margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="edit-notice-main-check" style="width:auto; margin:0;" ${originItem.isMain ? 'checked' : ''}>
                <label for="edit-notice-main-check" style="font-size:14px; font-weight:bold; color:#EF4444; cursor:pointer;">⭐ 메인 공지 지정</label>
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-weight:bold; display:block; margin-bottom:4px; font-size:12.5px;">안내 제목</label>
                <input type="text" id="edit-notice-title" value="${originItem.title || ''}" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-weight:bold; display:block; margin-bottom:4px; font-size:12.5px;">상세 내용 입력</label>
                <textarea id="edit-notice-content" style="width:100%; height:160px; padding:8px; border:1px solid #CBD5E1; border-radius:8px; resize:none; font-family:inherit;">${originItem.content || ''}</textarea>
            </div>
            <button class="modal-submit" id="submit-edit-prod-notice" style="width:100%; padding:11px; background:#4A90E2; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">수정 완료</button>
        </div>`);

    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-edit-prod-notice').onclick = async () => {
        const title = document.getElementById('edit-notice-title').value.trim();
        const content = document.getElementById('edit-notice-content').value.trim();
        const isMain = document.getElementById('edit-notice-main-check').checked;
        
        if (!title || !content) return alert('모두 입력해 주세요.');

        // 🎯 기존 배열 인덱스를 조준하여 수정된 값으로 실시간 교체
        const updatedNotice = { title, content, isMain };
        
        // 기존 요소를 제거하고 메인이면 맨 앞으로, 일반이면 기존 위치(혹은 유연한 배치)로 세팅 정렬
        notices[activeTab].splice(origIdx, 1);
        if (isMain) {
            notices[activeTab].unshift(updatedNotice);
        } else {
            notices[activeTab].splice(origIdx, 0, updatedNotice);
        }

        // 원본과 동일한 명세 구조의 { merge: true } 강제 병합 스토리지 업데이트 처리
        if (db) {
            try { 
                await db.collection('system').doc('storage').set({ 
                    product_tabs: tabs, 
                    product_notices: notices 
                }, { merge: true }); 
            } catch(err){ console.error("서버 전송 오류:", err); }
        }
        closeModal();
        renderProductView();
    };
}
