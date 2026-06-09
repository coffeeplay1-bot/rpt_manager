import { openModal, closeModal, db } from './app.js';

// 🎯 [오류 종결] 파일 전체 통틀어 최상단에 단 딱 한 번만 정의하여 중복 에러 차단
const cardColors = { '전체': '#F1F5F9', '단독': '#FFE5D9', '홀수일': '#E3F2FD', '짝수일': '#FCE4EC', '기타': '#E8F5E9' };
const pastelColors = ['#FFE5D9', '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0'];

export async function renderOpenChatView() {
    const container = document.getElementById('content-area');
    if (!container) return;

    let filters = ['전체', '단독', '홀수일', '짝수일', '기타'];
    let filterTemplates = {}, notices = { '전체': [], '단독': [], '홀수일': [], '짝수일': [], '기타': [] };

    if (db) {
        try {
            const sysDoc = await db.collection('system').doc('storage').get();
            if (sysDoc.exists) {
                const data = sysDoc.data() || {};
                if (data.katalk_filters) filters = data.katalk_filters;
                if (data.katalk_notices) notices = data.katalk_notices;
                if (data.katalk_filter_templates) filterTemplates = data.katalk_filter_templates;
            }
        } catch (e) { console.warn("로컬 세션 가동"); }
    }

    if (!filters.includes('전체')) filters.unshift('전체');
    let activeFilter = localStorage.getItem('current_openchat_active_filter') || '전체';

    container.innerHTML = `
        <div class="layout-wrapper">
            <div class="left-area" style="display:flex; flex-direction:column; gap:12px;">
                <div class="filter-row" id="openchat-filters" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:4px; align-items:center;"></div>
                <div id="openchat-template-card-view"></div>
                <div class="action-row" style="margin-bottom:2px;"><button class="main-btn" id="add-openchat-btn">추가</button></div>
                <div id="openchat-content-grid"></div>
            </div>
            <div class="simulator" style="background:#BACEE0; border-color:#B4C3D2;">
                <div class="sim-header" style="background:#BACEE0; border-bottom:1px solid rgba(0,0,0,0.05);">오픈채팅방 미리보기</div>
                <div class="sim-body"><div class="kakao-bubble-right" id="openchat-live-bubble" style="font-size:13.5px; line-height:1.45;">네임카드를 클릭하시면 동적 조합 문구가 이곳에 출력됩니다.</div></div>
                <div class="footer-mock">
                    <span style="font-size:18px; color:#CBD5E1;">＋</span>
                    <div class="input-mock" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:4px;">메시지 조합 대기 중</div>
                    <span class="send-mock" style="background:#334155; color:#FEE500; padding:4px 10px; border-radius:4px; font-size:12px;">전송</span>
                </div>
            </div>
        </div>
    `;

    const btnRow = document.getElementById('openchat-filters');
    filters.forEach((f, idx) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (f === activeFilter ? ' active' : '');
        btn.style.backgroundColor = cardColors[f] || pastelColors[idx % pastelColors.length];
        
        if (f === '전체') {
            btn.innerText = f;
            btn.onclick = () => { localStorage.setItem('current_openchat_active_filter', f); renderOpenChatView(); };
        } else {
            btn.style.display = 'inline-flex'; btn.style.alignItems = 'center'; btn.style.gap = '8px'; btn.style.paddingRight = '12px';
            btn.innerHTML = `<span>${f}</span><span class="btn-del-x" style="font-size:10px; font-weight:bold; color:#64748B; cursor:pointer; padding:2px 4px; border-radius:50%; transition:all 0.15s; line-height:1;">✕</span>`;
            
            btn.onclick = (e) => {
                if (e.target.classList.contains('btn-del-x')) return;
                localStorage.setItem('current_openchat_active_filter', f); renderOpenChatView();
            };

            const delX = btn.querySelector('.btn-del-x');
            delX.onmouseover = () => { delX.style.backgroundColor = 'rgba(0,0,0,0.08)'; delX.style.color = '#EF4444'; };
            delX.onmouseout = () => { delX.style.backgroundColor = 'transparent'; delX.style.color = '#64748B'; };
            delX.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`'${f}' 구분자와 내부 데이터를 모두 삭제할까요?`)) {
                    filters = filters.filter(item => item !== f); delete notices[f]; delete filterTemplates[f];
                    if (db) await db.collection('system').doc('storage').update({ katalk_filters: filters, katalk_notices: notices, katalk_filter_templates: filterTemplates });
                    localStorage.setItem('current_openchat_active_filter', '전체'); renderOpenChatView();
                }
            };
        }
        btnRow.appendChild(btn);
    });

    const addFilterBtn = document.createElement('button');
    addFilterBtn.className = 'add-filter-action-btn'; addFilterBtn.innerText = '+추가';
    addFilterBtn.onclick = () => showAddFilterModal(filters, filterTemplates, notices);
    btnRow.appendChild(addFilterBtn);

    const templateCardView = document.getElementById('openchat-template-card-view');
    if (activeFilter === '전체') {
        templateCardView.innerHTML = `<div style="background:#F8FAFC; padding:10px 14px; border-radius:8px; border:1px dashed #CBD5E1; font-size:12px; color:#475569;">💡 <b>전체 보기 모드:</b> 개별 구분자 탭을 누르면 지정된 [카톡 본문 뼈대 템플릿] 양식을 확인할 수 있습니다.</div>`;
    } else {
        const currentTmp = filterTemplates[activeFilter] || { text: '등록된 카톡 본문 뼈대 양식이 없습니다. 구분자 생성 시 본문을 기재해 주세요.' };
        templateCardView.innerHTML = `
            <div style="background:#FFFDF5; padding:12px; border-radius:10px; border:1px solid #FDE68A; box-shadow:0 2px 4px rgba(0,0,0,0.02); font-size:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid #FEF3C7; padding-bottom:4px;"><strong style="color:#B45309; font-size:12.5px;">📋 [${activeFilter}] 카톡 본문 뼈대 양식</strong></div>
                <div style="color:#475569; white-space:pre-wrap; line-height:1.4; background:rgba(255,255,255,0.6); padding:8px; border-radius:6px;">${currentTmp.text}</div>
            </div>`;
    }

    const grid = document.getElementById('openchat-content-grid');
    if (activeFilter === '전체') {
        grid.style = 'display:flex; flex-direction:column; gap:12px;';
        grid.innerHTML = `
            <div style="background:#FFFDFA; padding:8px; border-radius:8px; border:1px solid #E2E8F0;"><div style="font-weight:bold; font-size:13px; color:#B45309; padding-bottom:6px; margin-bottom:8px; border-bottom:2px solid #FDE68A;">🟡 단독 공지 목록</div><div id="s-box-oc"></div></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div style="background:#F8FAFC; padding:8px; border-radius:8px; border:1px solid #E2E8F0;"><div style="font-weight:bold; font-size:13px; color:#1D4ED8; padding-bottom:6px; margin-bottom:8px; border-bottom:2px solid #BFDBFE;">🔵 홀수일 공지 목록</div><div id="o-box-oc"></div></div>
                <div style="background:#FDF2F8; padding:8px; border-radius:8px; border:1px solid #E2E8F0;"><div style="font-weight:bold; font-size:13px; color:#BE185D; padding-bottom:6px; margin-bottom:8px; border-bottom:2px solid #FBCFE8;">🔴 짝수일 공지 목록</div><div id="e-box-oc"></div></div>
            </div>`;
        renderSplitSmartColumnList(notices['단독'] || [], '단독', document.getElementById('s-box-oc'), notices, filterTemplates);
        renderSplitSmartColumnList(notices['홀수일'] || [], '홀수일', document.getElementById('o-box-oc'), notices, filterTemplates);
        renderSplitSmartColumnList(notices['짝수일'] || [], '짝수일', document.getElementById('e-box-oc'), notices, filterTemplates);
    } else {
        renderSplitSmartColumnList(notices[activeFilter] || [], activeFilter, grid, notices, filterTemplates);
    }
    document.getElementById('add-openchat-btn').onclick = () => showAddKatalkNoticeModal(filters, filterTemplates, notices);
}



export function renderSplitSmartColumnList(rawList, filterName, target, globalNotices, filterTemplates) {
    target.innerHTML = '';
    if (rawList.length === 0) { target.innerHTML = '<p style="color:#94A3B8; font-size:11px; padding:4px;">공지 없음</p>'; return; }
    
    const gridContainer = document.createElement('div');
    gridContainer.style = 'display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items: start;';
    gridContainer.innerHTML = `<div id="am-split-oc-${filterName}" style="display:flex; flex-direction:column; gap:6px;"></div><div id="pm-split-oc-${filterName}" style="display:flex; flex-direction:column; gap:6px;"></div>`;
    target.appendChild(gridContainer);

    const amTarget = gridContainer.querySelector(`#am-split-oc-${filterName}`), pmTarget = gridContainer.querySelector(`#pm-split-oc-${filterName}`);
    const sorted = [...rawList].sort((a,b) => (a.title || '').localeCompare(b.title || '', 'ko'));
    const bubbleMirror = document.getElementById('openchat-live-bubble');
    const isDayFilter = (filterName === '홀수일' || filterName === '짝수일');

    sorted.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'msg-box'; 
        card.style = 'padding:12px; margin:0; border:none; border-radius:10px; background:#FFFFFF; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); font-size:12px; box-sizing:border-box;';
        
        const displayTitle = item.title || '제목없음', displayTime = item.timeMode || '종일', displayLink = item.chatLink || '링크없음';
        let ampmBadgeHtml = '', isAfternoon = false;
        
        if (isDayFilter) {
            let ampmColor = '#F5F5F4', ampmText = '#78716C';
            if (displayTime === '오전') { ampmColor = '#CCFBF1'; ampmText = '#0D9488'; }
            else if (displayTime === '오후') { ampmColor = '#F3E8FF'; ampmText = '#7C3AED'; isAfternoon = true; }
            ampmBadgeHtml = `<span style="padding:2px 6px; font-size:10.5px; font-weight:bold; border-radius:4px; background:${ampmColor}; color:${ampmText}; margin-left:4px;">${displayTime}</span>`;
        } else {
            if (displayTime === '오후') isAfternoon = true;
        }
        
        const bg = cardColors[filterName] || pastelColors[idx % pastelColors.length];
        card.innerHTML = `
            <div class="window-header" style="padding-bottom:4px; margin-bottom:4px; border-bottom:none; pointer-events:none; display:flex; align-items:center; width:100%;">
                <div class="window-title-area" style="display:flex; align-items:center; white-space:nowrap; flex:1; overflow:hidden;">
                    <span style="padding:2px 6px; font-size:10.5px; font-weight:bold; border-radius:4px; background:${bg}; color:#0F172A; margin-right:4px;">${filterName}</span>
                    <strong class="title-txt" style="font-size:13.5px; color:#1E293B; font-weight:bold; max-width:110px; overflow:hidden; text-overflow:ellipsis;">${displayTitle}</strong>
                    ${ampmBadgeHtml}
                </div>
                <button class="window-close-x" style="font-size:11px; pointer-events:auto; margin-left:auto; padding:2px;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px; pointer-events:auto;">
                <span style="font-size:10.5px; color:#64748B; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🔗 ${displayLink}</span>
                <div style="text-align:right;"><button class="icon-copy-btn" style="display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:bold; padding:4px 10px; background-color:#E1F0FF; color:#1E40AF; border:1px solid #93C5FD; border-radius:6px; cursor:pointer;">📋 문구 복사</button></div>
            </div>`;

        function getCombinedMessage() {
            const templateObj = filterTemplates[filterName] || { text: "" };
            let resultText = templateObj.text || "";
            const finalTimeReplacement = (displayTime === '오전' || displayTime === '오후') ? displayTime : "";
            return resultText.replace(/\[@구분자\]/g, filterName).replace(/\[@제목\]/g, displayTitle).replace(/\[@시간대\]/g, finalTimeReplacement).replace(/\[@LINK\]/g, displayLink).replace(/\[@링크\]/g, displayLink).replace(/  /g, " ").trim();
        }

        card.onclick = (e) => {
            if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn')) return;
            document.querySelectorAll('#openchat-content-grid .msg-box').forEach(b => b.classList.remove('selected-target'));
            card.classList.add('selected-target');
            if (bubbleMirror) bubbleMirror.innerText = getCombinedMessage();
        };
        
        card.querySelector('.icon-copy-btn').onclick = (e) => { e.stopPropagation(); navigator.clipboard.writeText(getCombinedMessage()).then(() => alert('자동 완성 조합된 전체 공지 문구가 복사되었습니다!')); };
        card.querySelector('.window-close-x').onclick = async (e) => {
            e.stopPropagation();
            if (confirm('삭제할까요?')) {
                const origIdx = globalNotices[filterName].findIndex(n => n.title === item.title && n.chatLink === item.chatLink);
                globalNotices[filterName].splice(origIdx, 1);
                if (db) await db.collection('system').doc('storage').update({ katalk_notices: globalNotices });
                renderOpenChatView();
            }
        };
        if (isDayFilter && isAfternoon) { pmTarget.appendChild(card); } else { amTarget.appendChild(card); }
    });
    if (amTarget.children.length === 0) amTarget.innerHTML = '<p style="color:#CBD5E1; font-size:11px; padding:4px;">오전 없음</p>';
    if (pmTarget.children.length === 0) pmTarget.innerHTML = '<p style="color:#CBD5E1; font-size:11px; padding:4px;">오후 없음</p>';
}

function showAddFilterModal(filters, filterTemplates, notices) {
    openModal(`
        <div class="modal-content">
            <button class="modal-close" id="close-modal">✕</button>
            <h3>🏷️ 새로운 구분자 및 본문 뼈대 생성</h3>
            <div style="margin-bottom:12px;"><label>구분자명 입력 (예: 홀수일, 단독)</label><input type="text" id="new-filter-name" placeholder="구분자명 입력"></div>
            <div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;"><label style="margin:0;">📝 카톡 본문 뼈대 양식 입력</label><span style="font-size:10.5px; color:#E11D48;">매크로: [@구분자] [@제목] [@시간대] [@링크]</span></div>
                <textarea id="new-filter-template-text" rows="5" placeholder="예시: 내일 [@제목] [@시간대] 투어 단톡방 링크 [@링크]" style="width:100%; padding:8px; font-size:12px; border:1px solid #CBD5E1; border-radius:8px; background-color:#F8FAFC; resize:none; font-family:inherit;"></textarea>
            </div>
            <button class="modal-submit" id="submit-filter">확인</button>
        </div>`);

    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-filter').onclick = async () => {
        const name = document.getElementById('new-filter-name').value.trim(), templateText = document.getElementById('new-filter-template-text').value.trim();
        if (!name || name === '전체' || filters.includes(name)) return alert('중복 또는 에러');
        if (!templateText) return alert('본문 뼈대 문구를 입력하세요.');

        filters.push(name); notices[name] = []; filterTemplates[name] = { text: templateText };
        if (db) await db.collection('system').doc('storage').update({ katalk_filters: filters, katalk_notices: notices, katalk_filter_templates: filterTemplates });
        localStorage.setItem('current_openchat_active_filter', name); closeModal(); renderOpenChatView();
    };
}

function showAddKatalkNoticeModal(filters, filterTemplates, notices) {
    const selectable = filters.filter(f => f !== '전체');
    let opts = ''; selectable.forEach(f => { opts += `<option value="${f}">${f}</option>`; });
    
    openModal(`
        <div class="modal-content">
            <button class="modal-close" id="close-modal">✕</button>
            <h3>📝 네임카드(공지 데이터) 추가</h3>
            <div style="margin-bottom:12px;"><label>구분 선택</label><select id="n-sel" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px; background-color:#F8FAFC;">${opts}</select></div>
            <div style="margin-bottom:12px;"><label>시간대 선택</label><select id="n-time" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px; background-color:#F8FAFC;"><option value="오전">오전</option><option value="오후">오후</option><option value="종일">종일</option></select></div>
            <div style="margin-bottom:12px;"><label>제목 입력</label><input type="text" id="n-ttl" placeholder="제목을 입력하세요"></div>
            <div style="margin-bottom:12px;"><label>오픈채팅방 링크 (링크)</label><input type="text" id="n-link" placeholder="https://kakao.com..."></div>
            <button class="modal-submit" id="n-sub">확인</button>
        </div>`);
    
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('n-sub').onclick = async () => {
        const filter = document.getElementById('n-sel').value, timeMode = document.getElementById('n-time').value, ttl = document.getElementById('n-ttl').value.trim(), chatLink = document.getElementById('n-link').value.trim();
        if (!ttl || !chatLink) return alert('제목과 링크 주소를 입력하세요.');
        
        if (!notices[filter]) notices[filter] = [];
        notices[filter].push({ title: ttl, timeMode: timeMode, chatLink: chatLink });
        if (db) await db.collection('system').doc('storage').update({ katalk_notices: notices });
        localStorage.setItem('current_openchat_active_filter', filter); closeModal(); renderOpenChatView();
    };
}
