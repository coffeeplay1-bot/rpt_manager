import { openModal, closeModal, db } from './app.js';

const pastelColors = ['#FFE5D9', '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#FCE4EC', '#E0F7FA', '#FFFDE7'];
const colorMap = { '전체': '#F1F5F9', '단독': '#FFE5D9', '홀수일': '#E3F2FD', '짝수일': '#FCE4EC', '기타': '#E8F5E9' };

function getPrettyPastelColor(seed, index) {
    if (colorMap[seed]) return colorMap[seed];
    return pastelColors[index % pastelColors.length];
}

export async function renderKatalkView() {
    const container = document.getElementById('content-area');
    if (!container) return;

    let filters = ['전체', '단독', '홀수일', '짝수일', '기타'];
    let notices = { '전체': [], '단독': [], '홀수일': [], '짝수일': [], '기타': [] };

    if (db) {
        try {
            const sysDoc = await db.collection('system').doc('storage').get();
            if (sysDoc.exists) {
                const serverData = sysDoc.data() || {};
                if (serverData.katalk_filters) filters = serverData.katalk_filters;
                if (serverData.katalk_notices) notices = serverData.katalk_notices;
            }
        } catch (err) {
            console.warn("로컬 모드 카톡 안내 준비 완료");
        }
    }

    if (!filters.includes('전체')) filters.unshift('전체');

    let activeFilter = localStorage.getItem('current_katalk_active_filter') || '전체';
    if (!filters.includes(activeFilter)) activeFilter = '전체';

    container.innerHTML = `
        <div class="layout-wrapper">
            <div class="left-area">
                <div class="filter-row" id="filter-buttons"></div>
                <div class="action-row"><button class="main-btn" id="add-katalk-btn">추가</button></div>
                <div id="katalk-display-area"></div>
            </div>
            <div class="simulator" style="background: #BACEE0; border-color: #B4C3D2;">
                <div class="sim-header" style="background: #BACEE0; border-bottom: 1px solid rgba(0,0,0,0.05);">카카오톡 대화방 미리보기</div>
                <div class="sim-body"><div class="kakao-bubble-right" id="kakao-live-bubble"></div></div>
                <div class="footer-mock">
                    <span style="font-size:18px; color:#CBD5E1;">＋</span>
                    <div class="input-mock" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:4px;">메시지를 입력하세요.</div>
                    <span class="send-mock" style="background:#334155; color:#FEE500; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">전송</span>
                </div>
            </div>
        </div>
    `;

    const btnRow = document.getElementById('filter-buttons');
    filters.forEach((f, idx) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (f === activeFilter ? ' active' : '');
        btn.innerText = f;
        btn.style.backgroundColor = getPrettyPastelColor(f, idx);
        btn.onclick = () => {
            localStorage.setItem('current_katalk_active_filter', f);
            renderKatalkView();
        };
        btnRow.appendChild(btn);
    });

    const addFilterBtn = document.createElement('button');
    addFilterBtn.className = 'add-filter-action-btn'; addFilterBtn.innerText = '+추가';
    addFilterBtn.onclick = () => showAddFilterModal(filters, notices);
    btnRow.appendChild(addFilterBtn);

    const displayArea = document.getElementById('katalk-display-area');
    if (activeFilter === '전체') {
        displayArea.className = ''; 
        displayArea.style.display = 'flex';
        displayArea.style.flexDirection = 'column';
        displayArea.style.gap = '15px';
        
        displayArea.innerHTML = `
            <div class="column-container" style="background:#FFFDFA; padding:10px; border-radius:8px; border:1px solid #E2E8F0;">
                <div class="column-header" style="font-weight:bold; font-size:14px; color:#B45309; padding-bottom:8px; margin-bottom:10px; border-bottom:2px solid #FDE68A;">🟡 단독 공지 목록</div>
                <div id="single-container" class="msg-grid"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div class="column-container" style="background:#F8FAFC; padding:10px; border-radius:8px; border:1px solid #E2E8F0;">
                    <div class="column-header" style="font-weight:bold; font-size:14px; color:#1D4ED8; padding-bottom:8px; margin-bottom:10px; border-bottom:2px solid #BFDBFE;">🔵 홀수일 공지 목록</div>
                    <div id="odd-container" class="msg-grid"></div>
                </div>
                <div class="column-container" style="background:#FDF2F8; padding:10px; border-radius:8px; border:1px solid #E2E8F0;">
                    <div class="column-header" style="font-weight:bold; font-size:14px; color:#BE185D; padding-bottom:8px; margin-bottom:10px; border-bottom:2px solid #FBCFE8;">🔴 짝수일 공지 목록</div>
                    <div id="even-container" class="msg-grid"></div>
                </div>
            </div>
        `;
        renderSortedListInto(notices['단독'] || [], '단독', document.getElementById('single-container'), notices);
        renderSortedListInto(notices['홀수일'] || [], '홀수일', document.getElementById('odd-container'), notices);
        renderSortedListInto(notices['짝수일'] || [], '짝수일', document.getElementById('even-container'), notices);
    } else {
        displayArea.className = 'msg-grid';
        displayArea.style.display = 'block';
        renderSortedListInto(notices[activeFilter] || [], activeFilter, displayArea, notices);
    }

    document.getElementById('add-katalk-btn').onclick = () => showAddKatalkNoticeModal(filters, notices);
}


function renderSortedListInto(rawList, filterName, targetElement, globalNotices) {
    targetElement.innerHTML = '';
    const sortedList = [...rawList].sort((a, b) => (a.title || '제목없음').localeCompare(b.title || '제목없음', 'ko'));
    const bubbleMirror = document.getElementById('kakao-live-bubble');

    if (sortedList.length === 0) {
        targetElement.innerHTML = '<p style="color:#94A3B8; font-size:13px; padding:10px;">등록된 공지가 없습니다.</p>';
        return;
    }

    sortedList.forEach((item, index) => {
        const originalIndex = globalNotices[filterName].findIndex(n => (n.title === item.title || (!n.title && !item.title)) && n.content === item.content);
        const card = document.createElement('div');
        
        if (index === 0 && document.querySelectorAll('.selected-target').length === 0) {
            card.className = 'msg-box selected-target';
            if (bubbleMirror) bubbleMirror.innerText = item.content;
        } else {
            card.className = 'msg-box';
        }
        
        let displayTitle = item.title || '제목없음';
        let ampmBadgeHtml = '';
        
        // 리스트 카드용 오전(민트)/오후(라벤더) 버튼 뱃지 스펙
        if (displayTitle.startsWith('[오전]')) {
            ampmBadgeHtml = `<span style="display:inline-block; padding:4px 10px; font-size:11px; font-weight:bold; border:none; border-radius:6px; background-color:#CCFBF1; color:#0D9488; margin-left:6px; line-height:1.2; box-sizing:border-box;">오전</span>`;
            displayTitle = displayTitle.replace('[오전]', '').trim();
        } else if (displayTitle.startsWith('[오후]')) {
            ampmBadgeHtml = `<span style="display:inline-block; padding:4px 10px; font-size:11px; font-weight:bold; border:none; border-radius:6px; background-color:#F3E8FF; color:#7C3AED; margin-left:6px; line-height:1.2; box-sizing:border-box;">오후</span>`;
            displayTitle = displayTitle.replace('[오후]', '').trim();
        }
        
        card.innerHTML = `
            <div class="window-header">
                <div class="window-title-area" style="display:flex; align-items:center; flex-wrap:wrap; padding:2px 0;">
                    <span style="display:inline-block; padding:4px 10px; font-size:11px; font-weight:bold; border:none; border-radius:6px; background-color:${getPrettyPastelColor(filterName, 0)}; color:#0F172A; margin-right:6px; line-height:1.2; box-sizing:border-box;">${filterName}</span>
                    <strong class="title-txt" style="font-size:14px; color:#1E293B; line-height:1.4;"></strong>
                    ${ampmBadgeHtml}
                </div>
                <button class="window-close-x">✕</button>
            </div>
            <div style="font-size:14px; color:#475569; white-space:pre-wrap; line-height:1.6; background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:10px;">${item.content}</div>
            <div class="bottom-actions"><button class="icon-copy-btn">📋 복사</button></div>
        `;
        card.querySelector('.title-txt').innerText = displayTitle || '제목없음';

        card.onclick = (e) => {
            if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn')) return;
            document.querySelectorAll('.msg-box').forEach(b => b.classList.remove('selected-target'));
            card.classList.add('selected-target');
            if (bubbleMirror) bubbleMirror.innerText = item.content;
        };

        card.querySelector('.icon-copy-btn').onclick = () => { navigator.clipboard.writeText(item.content).then(() => alert('공지가 복사되었습니다.')); };
        card.querySelector('.window-close-x').onclick = async () => {
            if (confirm(`'${displayTitle || '제목없는'}' 공지를 삭제할까요?`)) {
                globalNotices[filterName].splice(originalIndex, 1);
                if (db) { try { await db.collection('system').doc('storage').update({ katalk_notices: globalNotices }); } catch(e){} }
                renderKatalkView();
            }
        };
        targetElement.appendChild(card);
    });
}

function showAddFilterModal(filters, notices) {
    const html = `<div class="modal-content"><button class="modal-close" id="close-modal">✕</button><h3>🏷️ 새로운 구분자 생성</h3><input type="text" id="new-filter-name" placeholder="구분자명 입력"><button class="modal-submit" id="submit-filter">확인</button></div>`;
    openModal(html); document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-filter').onclick = async () => {
        const name = document.getElementById('new-filter-name').value.trim();
        if (!name || name === '전체' || filters.includes(name)) return alert('올바르지 않거나 중복된 이름입니다.');
        filters.push(name); notices[name] = [];
        if (db) { try { await db.collection('system').doc('storage').update({ katalk_filters: filters, katalk_notices: notices }); } catch(e){} }
        localStorage.setItem('current_katalk_active_filter', name); closeModal(); renderKatalkView();
    };
}

function showAddKatalkNoticeModal(filters, notices) {
    const selectable = filters.filter(f => f !== '전체');
    let optionsHtml = '';
    selectable.forEach(f => { 
        optionsHtml += `<option value="${f}">${f}</option>`;
    });

    let selectedAmPm = '';

    const html = `
        <div class="modal-content">
            <button class="modal-close" id="close-modal">✕</button>
            <h3>📝 공지사항 추가</h3>
            
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; display:block; margin-bottom:5px;">구분 선택</label>
                <select id="notice-filter-select" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:4px;">
                    ${optionsHtml}
                </select>
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; display:block; margin-bottom:5px;">시간대 선택</label>
                <div style="display:flex; gap:8px;">
                    <!-- 초기 상태는 둘 다 선택되지 않은 단정한 기본 대기 그레이 톤 -->
                    <button type="button" id="btn-am" style="padding:6px 16px; font-size:12px; font-weight:bold; border:none; border-radius:6px; cursor:pointer; background-color:#E2E8F0; color:#64748B; transition:all 0.2s;">오전</button>
                    <button type="button" id="btn-pm" style="padding:6px 16px; font-size:12px; font-weight:bold; border:none; border-radius:6px; cursor:pointer; background-color:#E2E8F0; color:#64748B; transition:all 0.2s;">오후</button>
                </div>
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; display:block; margin-bottom:5px;">제목</label>
                <input type="text" id="notice-title" placeholder="제목을 입력하세요" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:4px; box-sizing:border-box;">
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; display:block; margin-bottom:5px;">내용</label>
                <textarea id="notice-content" placeholder="내용을 입력하세요" rows="5" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:4px; box-sizing:border-box; resize:none; font-family:inherit;"></textarea>
            </div>
            
            <button class="modal-submit" id="submit-notice" style="width:100%; padding:10px; background:#334155; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
        </div>
    `;

    openModal(html); 
    document.getElementById('close-modal').onclick = closeModal;

    const amBtn = document.getElementById('btn-am');
    const pmBtn = document.getElementById('btn-pm');

    // 🎯 클릭 이벤트 트리거 시 네임카드 뱃지와 동일한 고유 컬러(민트/라벤더)가 정확히 점등되도록 처리
    amBtn.onclick = () => {
        selectedAmPm = '오전';
        amBtn.style.backgroundColor = '#CCFBF1'; amBtn.style.color = '#0D9488'; // 오전 활성화: 민트 그린
        pmBtn.style.backgroundColor = '#E2E8F0'; pmBtn.style.color = '#64748B'; // 오후 비활성화: 기본 회색
    };

    pmBtn.onclick = () => {
        selectedAmPm = '오후';
        pmBtn.style.backgroundColor = '#F3E8FF'; pmBtn.style.color = '#7C3AED'; // 오후 활성화: 라벤더 퍼플
        amBtn.style.backgroundColor = '#E2E8F0'; amBtn.style.color = '#64748B'; // 오전 비활성화: 기본 회색
    };

    document.getElementById('submit-notice').onclick = async () => {
        const targetFilter = document.getElementById('notice-filter-select').value;
        const rawTitle = document.getElementById('notice-title').value.trim();
        const content = document.getElementById('notice-content').value.trim();

        if (!selectedAmPm) return alert('오전 또는 오후 시간대를 선택해 주세요.');
        if (!content) return alert('내용을 입력해 주세요.');

        const finalTitle = rawTitle ? `[${selectedAmPm}] ${rawTitle}` : `[${selectedAmPm}] 제목없음`;

        if (!notices[targetFilter]) notices[targetFilter] = [];
        notices[targetFilter].push({ title: finalTitle, content: content });

        if (db) { 
            try { 
                await db.collection('system').doc('storage').update({ katalk_notices: notices }); 
            } catch(e){ console.error("데이터 저장 실패:", e); } 
        }

        localStorage.setItem('current_katalk_active_filter', targetFilter); 
        closeModal(); 
        renderKatalkView();
    };
}
