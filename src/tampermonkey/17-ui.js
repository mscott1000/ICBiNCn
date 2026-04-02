
  /************************************************************
 * UI
 ************************************************************/
GM_addStyle(`:root{ --mo-bg: #f5f7fb;          /* page chrome */
                    --mo-surface: #ffffff;     /* cards/panels */
                    --mo-surface-2: #eef2f7;   /* header/footer */
                    --mo-border: #d7dee8;      /* lines/borders */
                    --mo-text: #0f172a;        /* primary text (slate-900) */
                    --mo-muted: #475569;       /* secondary text (slate-600) */
                    --mo-primary: #2563eb;     /* Copy button */
                    --mo-primary-dk: #1d4ed8;  /* hover/active */
                    --mo-danger: #b42318;      /* Stop button */
                    --mo-danger-dk: #912018;
                    --mo-shadow: 0 10px 28px rgba(15, 23, 42, .18);}

            #moJsonDock{position:fixed; right:12px; bottom:12px;
                        width:520px; max-height:66vh;
                        z-index:999999;
                        font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
                        box-shadow:var(--mo-shadow);
                        border-radius:14px;
                        overflow:hidden;
                        border:1px solid var(--mo-border);
                        background:var(--mo-bg);
                        box-sizing:border-box;
                        display:flex;
                        flex-direction:column;}

            #moJsonHeader{background:var(--mo-surface-2);
                          border-bottom:1px solid var(--mo-border);
                          padding:10px;
                          display:flex;
                          align-items:center;
                          justify-content:space-between;
                          gap:8px;
                          position:relative;
                          padding-right:40px;
                          flex:0 0 auto;}

            #moJsonHeader .title{font-weight:900;
                                 font-size:14px;
                                 color:var(--mo-text);
                                 user-select:none;
                                 letter-spacing:.1px;}

            #moJsonHeader .btnRow{display:flex;
                                  gap:8px;
                                  flex-wrap:wrap;
                                  justify-content:flex-end;
                                  min-width:0;}

            #moJsonCloseX{position:absolute;
                          top:8px;
                          right:10px;
                          width:22px;
                          height:22px;
                          line-height:20px;
                          border:none;
                          background:transparent;
                          color:var(--mo-muted);
                          font-size:18px;
                          font-weight:900;
                          cursor:pointer;
                          border-radius:8px;
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          transition:background 120ms ease,color 120ms ease;}
            #moJsonCloseX:hover{background:rgba(37, 99, 235, .10); color:var(--mo-text);}

            #moJsonContent{padding:10px;
                           overflow:auto;
                           background:var(--mo-bg);
                           flex:1 1 auto;
                           min-height:0; /* critical for overflow scrolling in flex layouts */
                           max-height:none;}

            #moJsonFooter{background:var(--mo-surface-2);
                          border-top:1px solid var(--mo-border);
                          padding:10px;
                          flex:0 0 auto;}

            #moJsonDock *{box-sizing:border-box;}

            .moBlock{background:var(--mo-surface);
                     border:1px solid var(--mo-border);
                     border-radius:12px;
                     padding:10px;
                     margin-bottom:10px;}

            .moBlock h3{margin:0 0 6px 0;
                        font-size:12px;
                        color:var(--mo-text);
                        font-weight:950;
                        letter-spacing:.2px;}

            .moBtn{background:#fff;
                   color:var(--mo-text);
                   border:1.5px solid var(--mo-border);
                   padding:6px 10px;
                   border-radius:10px;
                   cursor:pointer;
                   font-size:12px;
                   font-weight:900;
                   user-select:none;
                   transition:transform 80ms ease,filter 120ms ease,background 120ms ease,border-color 120ms ease;}

            .moBtn:hover{filter:brightness(0.97);}
            .moBtn:active{transform:translateY(1px); filter:brightness(0.93);}

            #moJsonCopy{background:var(--mo-primary);
                        border:1.5px solid var(--mo-border);
                        color:#fff;}
            #moJsonCopy:hover{background:var(--mo-primary-dk);}

            #moJsonStop{background:var(--mo-danger);
                        border:1.5px solid var(--mo-border);
                        color:#fff;}
            #moJsonStop:hover{background:var(--mo-danger-dk);}

            .moNameRow{display:grid;
                       grid-template-columns:minmax(0, 1.3fr) minmax(0, 0.5fr) minmax(0, 1.8fr);
                       gap:8px;
                       margin-top:8px;}

            .moNameRowBottom{display:grid;
                             grid-template-columns:1fr auto;
                             gap:8px;
                             margin-top:8px;
                             align-items:end;}

            .moSearchBtn{height:32px;
                         padding:0 14px;
                         font-size:12px;
                         font-weight:950;
                         background:#16a34a;
                         border:1.5px solid var(--mo-border);
                         color:#fff;}
            .moSearchBtn:hover{filter:brightness(0.95);}
            .moSearchBtn:active{filter:brightness(0.90);}

            .moField{display:flex;
                     flex-direction:column;
                     gap:4px;}

            .moField label{font-size:11px;
                           font-weight:900;
                           color:var(--mo-muted);}

            .moField input{padding:7px 9px;
                           border:1px solid var(--mo-border);
                           border-radius:10px;
                           font-size:12px;
                           min-width:0;
                           width:100%;
                           box-sizing:border-box;
                           max-width:100%;
                           background:#fff;
                           color:var(--mo-text);
                           outline:none;
                           transition:border-color 120ms ease,box-shadow 120ms ease;}

            .moField input:focus{border-color:rgba(37, 99, 235, .65);
                                 box-shadow:0 0 0 3px rgba(37, 99, 235, .18);}

            .moField textarea{padding:7px 9px;
                              border:1px solid var(--mo-border);
                              border-radius:10px;
                              font-size:12px;
                              min-width:0;
                              width:100%;
                              box-sizing:border-box;
                              max-width:100%;
                              background:#fff;
                              color:var(--mo-text);
                              outline:none;
                              transition:border-color 120ms ease,box-shadow 120ms ease;
                              resize:vertical;
                              min-height:76px;}
            .moField textarea:focus{border-color:rgba(37, 99, 235, .65);
                                    box-shadow:0 0 0 3px rgba(37, 99, 235, .18);}

            .moBottomRow{display:flex;
                         gap:8px;
                         justify-content:flex-end;
                         margin-top:0;
                         flex-wrap:wrap;}

            .moHidden{display:none;}
`);

function escapeHtml(s) {return String(s ?? '')
                              .replaceAll('&','&amp;')
                              .replaceAll('<','&lt;')
                              .replaceAll('>','&gt;')
                              .replaceAll('"','&quot;')
                              .replaceAll("'","&#039;");}

const dock = document.createElement('div');
dock.id = 'moJsonDock';
dock.innerHTML = `
  <div id="moJsonHeader">
    <div class="title">I Can't Believe It's Not CaseNet!</div>
    <div class="btnRow">
      <button class="moBtn" id="moJsonCopy">Copy</button>
      <button class="moBtn" id="moJsonSummary">Summary</button>
      <button class="moBtn" id="moJsonStop">Stop</button>
    </div>
    <button id="moJsonCloseX" title="Close">×</button>
  </div>
  <div id="moJsonContent"></div>
  <div id="moJsonFooter">
    <div class="moBottomRow">
      <button class="moBtn" id="moJsonClear">Clear Log</button>
    </div>
  </div>
`;
(document.body || document.documentElement).appendChild(dock);

const $content = dock.querySelector('#moJsonContent');

function uiStatus(msg) {setStatus(msg);}

function addBlock(title,htmlInner) {const div = document.createElement('div');
                                   div.className = 'moBlock';
                                   div.innerHTML = `<h3>${escapeHtml(title)}</h3>${htmlInner}`;
                                   $content.appendChild(div);}

function render() {$content.innerHTML = '';
                   const ns = loadNameState();
                   const draft = loadDraft();
                   const p = ns?.params || draft;
                   addBlock('Name',`
      <div class="moNameRow">
        <div class="moField">
          <input id="moNsFirst" type="text" placeholder="First" value="${escapeHtml(p?.first || '')}">
        </div>
        <div class="moField">
          <input id="moNsMiddle" type="text" placeholder="M.I." value="${escapeHtml(p?.middle || '')}">
        </div>
        <div class="moField">
          <input id="moNsLast" type="text" placeholder="Last" value="${escapeHtml(p?.last || '')}">
        </div>
      </div>

      <div class="moNameRowBottom">
        <div class="moField">
          <label>Birth Year (four digits)</label>
          <input id="moNsYob" type="text" placeholder="YYYY" maxlength="4" value="${escapeHtml(p?.yob || '')}">
        </div>
        <div style="display:flex; gap:8px; align-items:end;">
          <button class="moBtn moSearchBtn" id="moJsonNameSearch">Search</button>
          <button class="moBtn" id="moJsonClearEntries" style="height:32px;">Clear Entries</button>
        </div>
      </div>
    `);
                   addBlock('Track This Case',`
  <div class="moNameRow" style="grid-template-columns:minmax(0, 1.1fr) minmax(0, 1.4fr) auto; align-items:end;">
    <div class="moField">
      <label>Case Number</label>
      <input id="moTrackCaseNo" type="text" placeholder="e.g. 18SL-CR01234" value="${escapeHtml((loadTrackState()?.caseNumber) || (loadTrackDraft()?.caseNumber) || '')}">
    </div>
    <div class="moField">
      <label>Email Address</label>
      <input id="moTrackEmail" type="email" placeholder="name@example.com" value="${escapeHtml((loadTrackState()?.email) || (loadTrackDraft()?.email) || '')}">
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:stretch; justify-content:flex-end;">
      <button class="moBtn" id="moTrackClearEntries" style="height:32px;">Clear TTC Entries</button>
      <button class="moBtn" id="moTrackSignup" style="height:32px;">Sign Up Case</button>
    </div>
  </div>
`);
                   const caseBatchDraft = loadCaseBatchDraft();
                   addBlock('Case Number Batch (Upcoming Dates)',`
  <div class="moField">
    <label>Case Numbers (newline preferred; optional court ID per line)</label>
    <textarea id="moCaseBatchNums" placeholder="e.g. 18SL-CR01234|21\n18SL-TR06789">${escapeHtml(caseBatchDraft?.caseNumbersText || '')}</textarea>
  </div>
  <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
    <button class="moBtn" id="moCaseBatchClear">Clear Entries</button>
    <button class="moBtn moSearchBtn" id="moCaseBatchRun">Run Batch</button>
  </div>
`);}
