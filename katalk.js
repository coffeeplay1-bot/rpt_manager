import { openModal, closeModal, db } from './app.js';
import { renderCalculatorView } from './calculator.js';

const cardColors = { '전체': '#F1F5F9', '단독': '#FFE5D9', '홀수일': '#E3F2FD', '짝수일': '#FCE4EC', '기타': '#E8F5E9' };
const pastelColors = ['#FFE5D9', '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0'];

export async function renderKatalkView() {
    const container = document.getElementById('content-area');
    if (!container) return;

<<<<<<< HEAD
    const mainTab = localStorage.getItem('katalk_main_tab') || 'katalk';
    if (mainTab === 'calc') { renderCalculatorView(container); return; }

=======
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5
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
        } catch (e) { console.warn("로컬 모드"); }
    }

    if (!filters.includes('전체')) filters.unshift('전체');
    let activeFilter = localStorage.getItem('current_katalk_active_filter') || '전체';


        if (activeFilter === '전체') {
        container.innerHTML = `
            <div class="layout-wrapper" style="display:block; width:100%;">
                <div class="left-area" style="width:100%; max-width:100%; display:flex; flex-direction:column; gap:12px;">
                    <div class="filter-row" id="filter-buttons" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:4px; align-items:center;"></div>
                    <div class="action-row" style="margin-bottom:2px;"><button class="main-btn" id="add-katalk-btn">추가</button></div>
                    <div id="katalk-content-grid"></div>
                    <div id="filter-template-card-view"></div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="layout-wrapper" style="display:flex; gap:25px; align-items:flex-start; width:100%; overflow:hidden;">
                <div class="left-area" style="flex:1; min-width:0; display:flex; flex-direction:column; gap:12px;">
                    <div class="filter-row" id="filter-buttons" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:4px; align-items:center;"></div>
                    <div class="action-row" style="margin-bottom:2px;"><button class="main-btn" id="add-katalk-btn">추가</button></div>
                    <div id="katalk-content-grid"></div>
                    <div id="filter-template-card-view"></div>
                </div>
                <div class="simulator" style="animation: slideInMrt 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; position: sticky; top: 10px;">
                    <div class="sim-header">마이리얼트립 상담방 미리보기</div>
                    <div class="sim-body">
                        <div class="mrt-bubble-right" id="kakao-live-bubble" style="font-size:14px; line-height:1.6;">네임카드를 클릭하시면 동적 조합 문구가 이곳에 출력됩니다.</div>
                    </div>
                    <div class="footer-mock">
                        <span style="font-size:18px; color:#CBD5E1; font-weight:bold;">＋</span>
                        <div class="input-mock">메시지를 입력해주세요.</div>
                        <span class="send-mock" style="color:#4AA0E6;">▲</span>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideInMrt {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
    }


        const btnRow = document.getElementById('filter-buttons');
    filters.forEach((f, idx) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (f === activeFilter ? ' active' : '');
        btn.style.backgroundColor = cardColors[f] || pastelColors[idx % pastelColors.length];
        
        if (f === '전체') {
            btn.innerText = f;
            btn.onclick = () => { localStorage.setItem('current_katalk_active_filter', f); renderKatalkView(); };
        } else {
            btn.style.display = 'inline-flex'; btn.style.alignItems = 'center'; btn.style.gap = '8px'; btn.style.paddingRight = '12px';
            btn.innerHTML = `<span>${f}</span><span class="btn-del-x" style="font-size:10px; font-weight:bold; color:#64748B; cursor:pointer; padding:2px 4px; border-radius:50%; transition:all 0.15s; line-height:1;">✕</span>`;
            
            btn.onclick = (e) => {
                if (e.target.classList.contains('btn-del-x')) return;
                localStorage.setItem('current_katalk_active_filter', f); renderKatalkView();
            };

            const delX = btn.querySelector('.btn-del-x');
            delX.onmouseover = () => { delX.style.backgroundColor = 'rgba(0,0,0,0.08)'; delX.style.color = '#EF4444'; };
            delX.onmouseout = () => { delX.style.backgroundColor = 'transparent'; delX.style.color = '#64748B'; };
            delX.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`'${f}' 구분자와 내부 데이터를 모두 삭제할까요?`)) {
                    filters = filters.filter(item => item !== f); delete notices[f]; delete filterTemplates[f];
                    if (db) await db.collection('system').doc('storage').update({ katalk_filters: filters, katalk_notices: notices, katalk_filter_templates: filterTemplates });
                    localStorage.setItem('current_katalk_active_filter', '전체'); renderKatalkView();
                }
            };
        }
        btnRow.appendChild(btn);
    });

    const addFilterBtn = document.createElement('button');
    addFilterBtn.className = 'add-filter-action-btn'; addFilterBtn.innerText = '+추가';
    addFilterBtn.onclick = () => showAddFilterModal(filters, filterTemplates, notices);
    btnRow.appendChild(addFilterBtn);

    const templateCardView = document.getElementById('filter-template-card-view');
    if (activeFilter === '전체') {
<<<<<<< HEAD
        templateCardView.innerHTML = ''; 
    } else {
        const currentTmp = filterTemplates[activeFilter] || { text: '등록된 카톡 본문 뼈대 양식이 없습니다. 구분자 생성 시 본문을 기재해 주세요.' };
        templateCardView.innerHTML = `
            <div style="background:#FFFDF5; padding:12px; border-radius:10px; border:1px solid #FDE68A; box-shadow:0 2px 4px rgba(0,0,0,0.02); font-size:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid #FEF3C7; padding-bottom:4px;">
                    <strong style="color:#B45309; font-size:12.5px;">📋 [${activeFilter}] 카톡 본문 뼈대 양식</strong>
                    <button id="edit-template-btn" style="padding:2px 8px; background:#F59E0B; color:white; border:none; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; transition:0.15s;">✏️ 수정</button>
                </div>
                <div style="color:#475569; white-space:pre-wrap; line-height:1.4; background:rgba(255,255,255,0.6); padding:8px; border-radius:6px;">${currentTmp.text}</div>
            </div>`;
        document.getElementById('edit-template-btn').onclick = () => showEditTemplateModal(activeFilter, filterTemplates);
=======
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
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5
    }


        const grid = document.getElementById('katalk-content-grid');
    
    if (activeFilter === '전체') {
        grid.style = 'display:flex; flex-direction:column; gap:12px; width:100%; box-sizing:border-box; align-items: flex-start;';
        let dashboardHtml = '';
        const activeSubFilters = filters.filter(f => f !== '전체');
        
        activeSubFilters.forEach((filterName, idx) => {
            const currentNotices = notices[filterName] || [];
            const currentCount = currentNotices.length;
            const currentBg = cardColors[filterName] || pastelColors[idx % pastelColors.length];
            
            const sortedCurrentNotices = [...currentNotices].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));
            let formattedNamesText = '';
            
            if (currentCount > 0) {
                let tempArray = [];
                sortedCurrentNotices.forEach((notice, nIdx) => {
                    const tTitle = notice.title || '제목 없음';
                    const tTime = notice.timeMode || '종일';
                    let bColor = '#F5F5F4', bText = '#78716C';
                    if (tTime === '오전') { bColor = '#CCFBF1'; bText = '#0D9488'; }
                    else if (tTime === '오후') { bColor = '#F3E8FF'; bText = '#7C3AED'; }
                    
                    const noticeItemHtml = `
                        <span style="display:inline-flex; align-items:center; gap:5px; background:#F8FAFC; border:1px solid #E2E8F0; padding:4.5px 9px; border-radius:6px; font-size:12px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex-shrink:0;">
                            <span style="font-weight:600; color:#334155;">${tTitle}</span>
                            <span style="font-size:9.5px; font-weight:bold; padding:1px 4px; border-radius:3px; background:${bColor}; color:${bText}; flex-shrink:0; line-height:1.1;">${tTime}</span>
                        </span>
                    `;
                    tempArray.push(noticeItemHtml);
                    if (tempArray.length === 5 || nIdx === currentCount - 1) {
                        formattedNamesText += `<div style="display:flex; gap:6px; align-items:center; width:max-content; margin-bottom:6px;">${tempArray.join('')}</div>`;
                        tempArray = [];
                    }
                });
            } else {
                formattedNamesText = '<span style="color:#94A3B8; font-size:12px; padding-left:4px;">등록된 공지 없음</span>';
            }
            
            dashboardHtml += `
                <div style="background:#FFFFFF; border:1px solid #E2E8F0; padding:14px 18px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; gap:6px; width:max-content; min-width:320px; max-width:100%; box-sizing:border-box;">
                    <div style="font-weight:bold; font-size:13.5px; color:#1E293B; display:flex; align-items:center; gap:8px; padding-bottom:8px; border-bottom:1px solid #F1F5F9; margin-bottom:4px; width:100%;">
                        <span style="padding:2px 6px; font-size:10.5px; font-weight:bold; border-radius:4px; background:${currentBg}; color:#0F172A;">${filterName}</span>
                        <span>공지 현황판</span>
                        <span style="font-size:11px; background:#E2E8F0; color:#475569; padding:2px 8px; border-radius:12px; font-weight:bold; margin-left:auto;">총 ${currentCount}개</span>
                    </div>
                    <div style="font-size:12.5px; color:#475569; padding:4px 0; line-height:1.6; display:flex; flex-direction:column; gap:6px; width:max-content;">
                        <b style="display:block; color:#475569; font-size:12px; margin-bottom:2px;">📋 공지 목록:</b>
                        ${formattedNamesText}
                    </div>
                </div>
            `;
        });
        grid.innerHTML = dashboardHtml;
    } else {
        grid.removeAttribute('style');
        renderSplitSmartColumnList(notices[activeFilter] || [], activeFilter, grid, notices, filterTemplates);
    }
    
    const noticeTriggerBtn = document.getElementById('add-katalk-btn');
    if (noticeTriggerBtn) {
        noticeTriggerBtn.onclick = () => showAddKatalkNoticeModal(filters, filterTemplates, notices);
    }
}


<<<<<<< HEAD
function showEditTemplateModal(filterName, filterTemplates) {
    const currentText = filterTemplates[filterName] ? (filterTemplates[filterName].text || "") : "";
    
    openModal(`
        <div class="modal-content" style="width: 700px !important; max-width: 90% !important; padding: 32px !important; border-radius: 16px;">
            <button class="modal-close" id="close-modal" style="top: 26px; right: 28px;">✕</button>
            <h3 style="font-size: 20px; margin-bottom: 20px;">✏️ [${filterName}] 본문 뼈대 양식 수정</h3>
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                    <label style="margin: 0; font-weight: bold; font-size: 13.5px; color: #334155;">📝 카톡 본문 뼈대 수정 입력</label>
                    <span style="font-size: 11px; color: #E11D48; font-weight: bold; background: #FFF1F2; padding: 3px 8px; border-radius: 4px;">치환 매크로: [@구분자] [@제목] [@시간대] [@링크]</span>
                </div>
                <textarea id="edit-filter-template-text" placeholder="본문 양식을 입력하세요..." style="width: 100% !important; height: 320px !important; padding: 14px !important; font-size: 13.5px !important; line-height: 1.6 !important; border: 1px solid #CBD5E1 !important; border-radius: 10px !important; background-color: #F8FAFC !important; resize: none !important; font-family: inherit; box-sizing: border-box;">${currentText}</textarea>
            </div>
            <button class="modal-submit" id="submit-edit-template" style="width: 100% !important; padding: 14px !important; background: #4A90E2 !important; color: white !important; border: none !important; border-radius: 8px !important; font-size: 15px !important; font-weight: bold; cursor: pointer; transition: 0.15s; margin-top: 10px;">수정 완료</button>
        </div>`);

    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-edit-template').onclick = async () => {
        const templateText = document.getElementById('edit-filter-template-text').value.trim();
        if (!templateText) return alert('수정할 본문 뼈대 문구를 입력하세요.');

        if (!filterTemplates[filterName]) filterTemplates[filterName] = {};
        filterTemplates[filterName].text = templateText;

        if (db) {
            try {
                await db.collection('system').doc('storage').update({ 
                    katalk_filter_templates: filterTemplates 
                });
            } catch(e) { console.error("템플릿 원격 저장 실패:", e); }
        }
        closeModal();
        renderKatalkView();
    };
}


export function renderSplitSmartColumnList(rawList, filterName, target, globalNotices, filterTemplates) {
    target.innerHTML = '';
    if (rawList.length === 0) { target.innerHTML = '<p style="color:#94A3B8; font-size:11px; padding:4px;">공지 없음</p>'; return; }
    
    const gridContainer = document.createElement('div');
    gridContainer.style = 'display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; align-items: start; width:100%; box-sizing:border-box;';
    gridContainer.innerHTML = `
        <div id="all-split-${filterName}" style="display:flex; flex-direction:column; gap:6px; background:#F8FAFC; padding:8px; border-radius:10px; border:1px solid #E2E8F0;"><div style="font-weight:bold; font-size:12px; color:#475569; padding-bottom:4px; margin-bottom:4px; border-bottom:2px solid #CBD5E1; text-align:center;">⚪ 종일 공지</div></div>
        <div id="am-split-${filterName}" style="display:flex; flex-direction:column; gap:6px; background:#F0FDFA; padding:8px; border-radius:10px; border:1px solid #CCFBF1;"><div style="font-weight:bold; font-size:12px; color:#0D9488; padding-bottom:4px; margin-bottom:4px; border-bottom:2px solid #99F6E4; text-align:center;">🟢 오전 공지</div></div>
        <div id="pm-split-${filterName}" style="display:flex; flex-direction:column; gap:6px; background:#FAF5FF; padding:8px; border-radius:10px; border:1px solid #F3E8FF;"><div style="font-weight:bold; font-size:12px; color:#7C3AED; padding-bottom:4px; margin-bottom:4px; border-bottom:2px solid #E9D5FF; text-align:center;">🟣 오후 공지</div></div>`;
    target.appendChild(gridContainer);

    const allTarget = gridContainer.querySelector(`#all-split-${filterName}`);
    const amTarget = gridContainer.querySelector(`#am-split-${filterName}`);
    const pmTarget = gridContainer.querySelector(`#pm-split-${filterName}`);

    const sorted = [...rawList].sort((a,b) => (a.title || '').localeCompare(b.title || '', 'ko'));
=======
function renderSortedListInto(rawList, filterName, targetElement, globalNotices) {
    targetElement.innerHTML = '';
    const sortedList = [...rawList].sort((a, b) => (a.title || '제목없음').localeCompare(b.title || '제목없음', 'ko'));
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5
    const bubbleMirror = document.getElementById('kakao-live-bubble');
    const isDayFilter = (filterName === '홀수일' || filterName === '짝수일');

    sorted.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'msg-box'; card.style = 'padding:12px; margin:0; border:none; border-radius:10px; background:#FFFFFF; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); font-size:12px; box-sizing:border-box;';
        
        const displayTitle = item.title || '제목없음', displayTime = item.timeMode || '종일', displayLink = item.chatLink || '링크없음';
        let ampmBadgeHtml = '';
        if (isDayFilter) {
            let ampmColor = '#F5F5F4', ampmText = '#78716C';
            if (displayTime === '오전') { ampmColor = '#CCFBF1'; ampmText = '#0D9488'; }
            else if (displayTime === '오후') { ampmColor = '#F3E8FF'; ampmText = '#7C3AED'; }
            ampmBadgeHtml = `<span style="padding:2px 6px; font-size:10.5px; font-weight:bold; border-radius:4px; background:${ampmColor}; color:${ampmText}; margin-left:4px;">${displayTime}</span>`;
        }
        
<<<<<<< HEAD
        const bg = cardColors[filterName] || pastelColors[idx % pastelColors.length];
        // 🎯 개별 네임카드 안에 문구 복사와 세트로 수정 버튼을 정식 이식
        // 🎯 katalk.js 내부의 card.innerHTML = `...`; 구역만 딱 찾아서 이 코드로 교체해 주세요!
        card.innerHTML = `
            <div class="window-header" style="padding-bottom:4px; margin-bottom:4px; border-bottom:none; pointer-events:none; display:flex; align-items:center; width:100%; justify-content:space-between; gap:6px;">
                <div class="window-title-area" style="display:flex; align-items:center; white-space:nowrap; flex:1; min-width:0; overflow:hidden; gap:4px;">
                    <span style="padding:2px 6px; font-size:10.5px; font-weight:bold; border-radius:4px; background:${bg}; color:#0F172A; flex-shrink:0;">${filterName}</span>
                    <strong class="title-txt" style="font-size:13.5px; color:#1E293B; font-weight:bold; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0;"></strong>
                    <div style="flex-shrink:0; display:inline-flex;">${ampmBadgeHtml}</div>
                </div>
                
                <!-- 🎯 [해결] 우측 상단 X 삭제 버튼 바로 왼쪽에 텍스트 없이 정갈한 아이콘 형태로 수정 버튼 재배치 -->
                <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                    <button class="edit-card-btn" style="font-size:11px; pointer-events:auto; padding:2px; background:none; border:none; cursor:pointer; transition:0.15s;" title="공지 수정">✏️</button>
                    <button class="window-close-x" style="font-size:11px; pointer-events:auto; padding:2px;">✕</button>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px; pointer-events:auto;">
                <span style="font-size:10.5px; color:#64748B; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🔗 ${displayLink}</span>
                <!-- 🎯 하단 우측에는 불필요한 글자 스위치를 빼고 복사 버튼만 넓고 단정하게 고정 -->
                <div style="text-align:right;">
                    <button class="icon-copy-btn" style="display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:bold; padding:4px 10px; background-color:#E1F0FF; color:#1E40AF; border:1px solid #93C5FD; border-radius:6px; cursor:pointer;">📋 복사</button>
                </div>
            </div>`;


        card.querySelector('.title-txt').innerText = displayTitle;


                function getCombinedMessage() {
            const templateObj = filterTemplates[filterName] || { text: "" };
            let resultText = templateObj.text || "";
            const finalTimeReplacement = (displayTime === '오전' || displayTime === '오후') ? displayTime : "";
            return resultText.replace(/\[@구분자\]/g, filterName).replace(/\[@제목\]/g, displayTitle).replace(/\[@시간대\]/g, finalTimeReplacement).replace(/\[@LINK\]/g, displayLink).replace(/\[@링크\]/g, displayLink).replace(/  /g, " ").trim();
        }
=======
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
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5

        card.onclick = (e) => {
            if (e.target.classList.contains('window-close-x') || e.target.classList.contains('icon-copy-btn') || e.target.classList.contains('edit-card-btn')) return;
            document.querySelectorAll('#katalk-content-grid .msg-box').forEach(b => b.classList.remove('selected-target'));
            card.classList.add('selected-target');
            if (bubbleMirror) bubbleMirror.innerText = getCombinedMessage();
        };
        
        card.querySelector('.icon-copy-btn').onclick = (e) => { e.stopPropagation(); navigator.clipboard.writeText(getCombinedMessage()).then(() => alert('자동 완성 조합된 전체 공지 문구가 복사되었습니다!')); };
        
        // 🎯 수정 버튼 클릭 시 원본 보존형 네임카드 전용 기획 편집 모달 인터페이스 호출
        card.querySelector('.edit-card-btn').onclick = (e) => {
            e.stopPropagation();
            showEditNoticeModal(filterName, globalNotices, item);
        };

<<<<<<< HEAD
        card.querySelector('.window-close-x').onclick = async (e) => {
            e.stopPropagation();
            if (confirm('삭제할까요?')) {
                const origIdx = globalNotices[filterName].findIndex(n => n.title === item.title && n.chatLink === item.chatLink);
                globalNotices[filterName].splice(origIdx, 1);
                if (db) await db.collection('system').doc('storage').update({ katalk_notices: globalNotices });
=======
        card.querySelector('.icon-copy-btn').onclick = () => { navigator.clipboard.writeText(item.content).then(() => alert('공지가 복사되었습니다.')); };
        card.querySelector('.window-close-x').onclick = async () => {
            if (confirm(`'${displayTitle || '제목없는'}' 공지를 삭제할까요?`)) {
                globalNotices[filterName].splice(originalIndex, 1);
                if (db) { try { await db.collection('system').doc('storage').update({ katalk_notices: globalNotices }); } catch(e){} }
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5
                renderKatalkView();
            }
        };

        if (displayTime === '오전') { amTarget.appendChild(card); } else if (displayTime === '오후') { pmTarget.appendChild(card); } else { allTarget.appendChild(card); }
    });

    if (allTarget.children.length === 1) allTarget.insertAdjacentHTML('beforeend', '<p style="color:#CBD5E1; font-size:11px; padding:4px; text-align:center;">없음</p>');
    if (amTarget.children.length === 1) amTarget.insertAdjacentHTML('beforeend', '<p style="color:#CBD5E1; font-size:11px; padding:4px; text-align:center;">없음</p>');
    if (pmTarget.children.length === 1) pmTarget.insertAdjacentHTML('beforeend', '<p style="color:#CBD5E1; font-size:11px; padding:4px; text-align:center;">없음</p>');
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
        localStorage.setItem('current_katalk_active_filter', name); closeModal(); renderKatalkView();
    };
}


function showAddKatalkNoticeModal(filters, filterTemplates, notices) {
    const selectable = filters.filter(f => f !== '전체');
<<<<<<< HEAD
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
        localStorage.setItem('current_katalk_active_filter', filter); closeModal(); renderKatalkView();
    };
}

// 🎯 [신규 기능 마감] 개별 네임카드 내용 정밀 실시간 편집창 모달 파트가 단 한자도 유실되지 않고 안전하게 포함되었습니다.
function showEditNoticeModal(filterName, globalNotices, originItem) {
    const origIdx = globalNotices[filterName].findIndex(n => n.title === originItem.title && n.chatLink === originItem.chatLink);
    if (origIdx === -1) return alert('원본 없음');

    openModal(`
        <div class="modal-content">
            <button class="modal-close" id="close-modal">✕</button>
            <h3>✏️ 공지 내용(네임카드) 수정</h3>
            <div style="margin-bottom:12px;"><label>구분</label><input type="text" value="${filterName}" readonly style="width:100%; padding:8px; background:#F1F5F9; border-radius:8px; border:1px solid #CBD5E1;"></div>
            <div style="margin-bottom:12px;">
                <label>시간대</label>
                <select id="edit-n-time" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px;">
                    <option value="오전" ${originItem.timeMode === '오전' ? 'selected' : ''}>오전</option>
                    <option value="오후" ${originItem.timeMode === '오후' ? 'selected' : ''}>오후</option>
                    <option value="종일" ${originItem.timeMode === '종일' ? 'selected' : ''}>종일</option>
                </select>
            </div>
            <div style="margin-bottom:12px;"><label>제목</label><input type="text" id="edit-n-ttl" value="${originItem.title || ''}" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px;"></div>
            <div style="margin-bottom:12px;"><label>링크</label><input type="text" id="edit-n-link" value="${originItem.chatLink || ''}" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px;"></div>
            <button class="modal-submit" id="submit-edit-notice">수정 완료</button>
        </div>`);

    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('submit-edit-notice').onclick = async () => {
        const timeMode = document.getElementById('edit-n-time').value;
        const ttl = document.getElementById('edit-n-ttl').value.trim();
        const chatLink = document.getElementById('edit-n-link').value.trim();
        if (!ttl || !chatLink) return alert('입력 필수');

        globalNotices[filterName][origIdx] = { title: ttl, timeMode: timeMode, chatLink: chatLink };
        if (db) { try { await db.collection('system').doc('storage').update({ katalk_notices: globalNotices }); } catch(e){} }
        closeModal(); renderKatalkView();
=======
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
>>>>>>> 3ce8f759558b04e50d8dd98350962b8ea591a8d5
    };
}
