
  /************************************************************
 * UI
 ************************************************************/
GM_addStyle(`:root{ --mo-bg: #f5f7fb;          /* page chrome */
                    --mo-surface: #ffffff;     /* cards/panels */
                    --mo-surface-2: #eef2f7;   /* header/footer/status */
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
            #moJsonDock.moHidden{display:none;}

            #moJsonLauncher{position:fixed;
                            right:12px;
                            bottom:12px;
                            z-index:999999;
                            font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
                            background:var(--mo-primary);
                            color:#fff;
                            border:1px solid var(--mo-border);
                            border-radius:12px;
                            box-shadow:var(--mo-shadow);
                            font-weight:900;
                            font-size:12px;
                            padding:10px 14px;
                            cursor:pointer;
                            user-select:none;}
            #moJsonLauncher:hover{background:var(--mo-primary-dk);}
            #moJsonLauncher.moHidden{display:none;}

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

            #moJsonStatus{padding:8px 10px;
                          border-bottom:1px solid var(--mo-border);
                          font-size:12px;
                          color:var(--mo-muted);
                          background:var(--mo-surface-2);
                          white-space:pre-wrap;
                          flex:0 0 auto;}

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
            #moJsonFooterInner{display:flex;
                               align-items:center;
                               justify-content:space-between;
                               gap:8px;}

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
                             grid-template-columns:minmax(0, 0.3fr) minmax(0, 1.7fr);
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

            .moField label{font-size:12px;
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

            #moJsonHelpBtn{background:#d4a017;
                           border:1.5px solid #ad7f00;
                           color:#2f2200;}
            #moJsonHelpBtn:hover{background:#e0ad1f;}

            #moJsonHelpPanel{position:fixed;
                             right:542px;
                             bottom:12px;
                             width:460px;
                             max-width:min(460px,calc(100vw - 24px));
                             max-height:66vh;
                             overflow:auto;
                             background:#fffef8;
                             border:1px solid #d9be6a;
                             border-radius:12px;
                             box-shadow:var(--mo-shadow);
                             padding:12px 12px 14px 12px;
                             z-index:1000000;
                             transition:opacity 140ms ease,transform 140ms ease;}
            #moJsonHelpPanel.moHidden{display:block;
                                      opacity:0;
                                      transform:translateX(12px);
                                      pointer-events:none;}
            #moJsonHelpClose{position:sticky;
                             top:0;
                             left:0;
                             width:26px;
                             height:26px;
                             border:none;
                             border-radius:8px;
                             background:#fff0bf;
                             color:#574100;
                             font-size:18px;
                             line-height:18px;
                             font-weight:900;
                             cursor:pointer;}
            #moJsonHelpHeading{text-align:center;
                               font-size:16px;
                               font-weight:950;
                               margin:2px 0 8px 0;}
            #moJsonHelpSubheading{text-align:center;
                                  font-size:14px;
                                  font-weight:900;
                                  margin:0 0 12px 0;}
            #moJsonHelpBody{text-align:left;
                            font-size:14px;
                            font-weight:850;
                            line-height:1.45;
                            white-space:pre-wrap;
                            margin:0;}

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
    </div>
    <button id="moJsonCloseX" title="Close">×</button>
  </div>
  <div id="moJsonStatus">Ready.</div>
  <div id="moJsonContent"></div>
  <div id="moJsonFooter">
    <div id="moJsonFooterInner">
      <button class="moBtn" id="moJsonHelpBtn">Help</button>
      <div class="moBottomRow">
        <button class="moBtn" id="moJsonStop">Stop All</button>
        <button class="moBtn" id="moJsonClear">Clear Log</button>
      </div>
    </div>
  </div>
`;
const launcher = document.createElement('button');
launcher.id = 'moJsonLauncher';
launcher.type = 'button';
launcher.textContent = 'ICBiNCn';

(document.body || document.documentElement).appendChild(dock);
(document.body || document.documentElement).appendChild(launcher);

const helpPanel = document.createElement('div');
helpPanel.id = 'moJsonHelpPanel';
helpPanel.className = 'moHidden';
helpPanel.innerHTML = `
  <button id="moJsonHelpClose" title="Close Help">×</button>
  <div id="moJsonHelpHeading">FAQ / Tips</div>
  <div id="moJsonHelpSubheading">Having trouble? Here are some issues related to how the tool works that you might come across:</div>
  <div id="moJsonHelpBody">
> Buttons -
"Copy" - Displays the number of cases in the tool's log. Click to add the full rundown of case information in the log to your clipboard.
"Summary" - Click to add a summary of the "copy" log to your clipboard, with only the Case Number, Charge Text, and a 'status' of warrant/nonwarrant/hold on license. It will display those with holds first, then warrants, then nonwarrants, and sort them by jurisdiction.
"X" - Minimizes the tool. If you want to turn the tool off temporarily, click "Manage Extensions" and toggle Tampermonkey off.
"Search" - Searches. The year is used to sort - the tool searches all name results (up to 1000) then drops mismatched Years of Birth. If you enter a very common first-last name pair, it will search them all and then give up - this is on purpose, I don't want to brick your work laptop. Enter a middle initial maybe.
"Clear Entries" - only from the section the button lives in.
"Send Verification Email" - Click to sign up the case number you entered for Case.net's 'Track This Case' service, and send the verification email to the address listed.
"Stop All" - Emergency stop. Any funny business stops here, and I mean it.
"Clear Log" - Click to empty all cases attached to the current log. It's a good habit to click this before you run a new search, and the tool is supposed to make you do that, but sometimes it forgets.

> Only one page of Case.net should be open while the tool is searching - multiple instances of the tool will try to read over each other's shoulder, and they will be bad at it.

> It doesn't search Municourt.net, you still have to do that.

> Do NOT use an account logged into Case.net with a BAR number. I have no idea how the tool will interact with the website with that level of access, it seems like a privacy issue that I am not equipped to deal with professionally.

> The tool is tuned to the language of the clerks in our most commonly used Courts, but will not catch unique judge/clerk notes or things like them.

> The tool only exists on the Google profile you add it to, on the machine you copy-pasted it to. For example, if you install Tampermonkey and load this script onto it while logged into Chrome on a personal computer, that same Chrome profile on any other computer will show the Tampermonkey extension but it will NOT have this script.

Once you have Tampermonkey on your Chrome profile, each computer gets its own monkey, and you have to teach each one how to use this tool (same install steps, minus the "adding extension" part).

> If you have suggestions, please let me know! I use this tool most work days, and update it often. Feel free to update yours with the shared Google Doc, and email tapinstl@gmail.com to reach me or Miranda.

Love, Mason
  </div>
`;
(document.body || document.documentElement).appendChild(helpPanel);

const $status = dock.querySelector('#moJsonStatus');
const $content = dock.querySelector('#moJsonContent');

function minimizeDock() {dock.classList.add('moHidden');
                         launcher.classList.remove('moHidden');
                         closeHelpPanel();}

function expandDock() {dock.classList.remove('moHidden');
                       launcher.classList.add('moHidden');}

function positionHelpPanel() {const rect = dock.getBoundingClientRect();
                              const right = Math.max(8,window.innerWidth - rect.left + 10);
                              const bottom = Math.max(8,window.innerHeight - rect.bottom);
                              helpPanel.style.right = `${right}px`;
                              helpPanel.style.bottom = `${bottom}px`;}

function openHelpPanel() {positionHelpPanel();
                          helpPanel.classList.remove('moHidden');}

function closeHelpPanel() {helpPanel.classList.add('moHidden');}

window.addEventListener('resize',() => {if (!helpPanel.classList.contains('moHidden')) positionHelpPanel();});

function uiStatus(msg) {$status.textContent = msg;
                        setStatus(msg);}

function addBlock(title,htmlInner) {const div = document.createElement('div');
                                   div.className = 'moBlock';
                                   div.innerHTML = `${title ? `<h3>${escapeHtml(title)}</h3>` : ''}${htmlInner}`;
                                   $content.appendChild(div);}

launcher.addEventListener('click',() => {expandDock();});
expandDock();

function render() {const log = loadLog();
                   $content.innerHTML = '';
                   const copyBtn = dock.querySelector('#moJsonCopy');
                   if (copyBtn) copyBtn.textContent = `Copy (${log.length})`;
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

      <div class="moNameRowBottom" style="grid-template-columns:minmax(0, 0.36fr) minmax(0, 1.64fr);">
        <div class="moField">
          <label>Birth Year</label>
          <input id="moNsYob" type="text" placeholder="YYYY" maxlength="4" value="${escapeHtml(p?.yob || '')}">
        </div>
        <div style="display:flex; gap:8px; align-items:end; width:100%;">
          <button class="moBtn moSearchBtn" id="moJsonNameSearch" style="flex:1;">Search</button>
          <button class="moBtn" id="moJsonClearEntries" style="height:32px; flex:1;">Clear Entries</button>
        </div>
      </div>
    `);
                   addBlock('Track This Case',`
  <div class="moNameRow" style="grid-template-columns:minmax(0, 0.9fr) minmax(0, 1.3fr); align-items:end;">
    <div class="moField">
      <label>Case Number</label>
      <input id="moTrackCaseNo" type="text" placeholder="e.g. 18SL-CR01234" value="${escapeHtml((loadTrackState()?.caseNumber) || (loadTrackDraft()?.caseNumber) || '')}">
    </div>
    <div class="moField">
      <label>Email Address</label>
      <input id="moTrackEmail" type="email" placeholder="name@example.com" value="${escapeHtml((loadTrackState()?.email) || (loadTrackDraft()?.email) || '')}">
    </div>
  </div>
  <div class="moNameRowBottom" style="grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);">
    <button class="moBtn" id="moTrackSignup" style="height:32px;">Send Verification Email</button>
    <button class="moBtn" id="moTrackClearEntries" style="height:32px;">Clear Entries</button>
  </div>
`);
}
