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

    // 🎯 방어막 데이터 세팅 (클라우드 DB가 준비 전이거나 가짜 키 상태일 때 터지지 않게 보호)
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
        displayArea.className = 'split-view';
        displayArea.innerHTML = `
            <div class="column-container"><div class="column-header">🔵 홀수일 공지 목록</div><div id="odd-container" class="msg-grid"></div></div>
            <div class="column-container"><div class="column-header">🔴 짝수일 공지 목록</div><div id="even-container" class="msg-grid"></div></div>
        `;
        renderSortedListInto(notices['홀수일'] || [], '홀수일', document.getElementById('odd-container'), notices);
        renderSortedListInto(notices['짝수일'] || [], '짝수일', document.getElementById('even-container'), notices);
    } else {
        displayArea.className = 'msg-grid';
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
        
        card.innerHTML = `
            <div class="window-header">
                <div class="window-title-area"><span class="sub-tab" style="padding:2px 8px; font-size:11px; background:${getPrettyPastelColor(filterName, 0)};">${filterName}</span><strong class="title-txt" style="font-size:14px; margin-left:5px;"></strong></div>
                <button class="window-close-x">✕</button>
            </div>
            <div style="font-size:14px; color:#475569; white-space:pre-wrap; line-height:1.6; background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:10px;">${item.content}</div>
            <div class="bottom-actions"><button class="icon-copy-btn">📋 복사</button></div>
        `;
        card.querySelector('.title-txt').innerText = item.title || '제목없음';

        card.onclick = (e) => {
            if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn')) return;
            document.querySelectorAll('.msg-box').forEach(b => b.classList.remove('selected-target'));
            card.classList.add('selected-target');
            if (bubbleMirror) bubbleMirror.innerText = item.content;
        };

        card.querySelector('.icon-copy-btn').onclick = () => { navigator.clipboard.writeText(item.content).then(() => alert('공지가 복사되었습니다.')); };
        card.querySelector('.window-close-x').onclick = async () => {
            if (confirm(`'${item.title || '제목없는'}' 공지를 삭제할까요?`)) {
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
    selectable.forEach(f => { optionsHtml += '<option value="' + f + '">' + f + '</option>'; });

    const html = `<div class="modal-content"><button class="modal-close" id="close-modal">✕</button><h3>💬 카톡 공지 추가</h3><label style="font-size:13px; font-weight:bold;">구분자 선택</label><select id="katalk-filter-select" style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #CBD5E1; border-radius:6px;">${optionsHtml}</select><label style="font-size:13px; font-weight:bold;">공지 제목</label><input type="text" id="katalk-title" placeholder="제목 입력"><label style="font-size:13px; font-weight:bold;">공지 내용</label><textarea id="katalk-content" placeholder="본문 문구 입력"></textarea><button class="modal-submit" id="submit-katalk">등록</button></div>`;
    openModal(html); document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-katalk').onclick = async () => {
        const filterTarget = document.getElementById('katalk-filter-select').value;
        const title = document.getElementById('katalk-title').value.trim();
        const content = document.getElementById('katalk-content').value.trim();
        if (!title || !content) return alert('모두 입력해 주세요.');

        if (!notices[filterTarget]) notices[filterTarget] = [];
        notices[filterTarget].push({ title, content });

        if (db) { try { await db.collection('system').doc('storage').update({ katalk_notices: notices }); } catch(e){} }
        localStorage.setItem('current_katalk_active_filter', filterTarget); closeModal(); renderKatalkView();
    };
}
