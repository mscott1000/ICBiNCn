const CASEY_SPREADSHEET_ID = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const CASEY_SHEET_ID = 1261396864;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Casey')
    .addItem('Connect search results', 'connectCasey')
    .addItem('Refresh BA search links', 'refreshCaseyLinks').addToUi();
}

function caseySheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (book.getId() !== CASEY_SPREADSHEET_ID) throw new Error('Install this script in Intake 2026.');
  const sheet = book.getSheets().find(s => s.getSheetId() === CASEY_SHEET_ID);
  if (!sheet || sheet.getName() !== 'Weekly Call Log') throw new Error('Weekly Call Log tab not found.');
  return sheet;
}

function caseyLinkFormula_(row) {
  const base = 'https://www.courts.mo.gov/casenet/nameSearch.do?newSearch=Y#icbincn=weekly-call-log&spreadsheet=' + CASEY_SPREADSHEET_ID + '&gid=' + CASEY_SHEET_ID;
  const year = 'IF(ISNUMBER(Q' + row + '),YEAR(Q' + row + '),VALUE(REGEXEXTRACT(TO_TEXT(Q' + row + '),"(?:19|20)[0-9]{2}")))';
  return '=IF(OR(N' + row + '="",O' + row + '="",Q' + row + '=""),"",IFERROR(IF(AND(' + year + '>=1900,' + year + '<=2099),HYPERLINK("' + base + '&row="&ROW()&"&first="&ENCODEURL(TRIM(N' + row + '))&"&last="&ENCODEURL(TRIM(O' + row + '))&"&yob="&' + year + ',"🐾 Casey"),"Check DOB"),"Check DOB"))';
}

function refreshCaseyLinks() {
  const sheet = caseySheet_();
  // Preserve existing outputs and keep template rows 2–3 untouched.
  const count = sheet.getMaxRows() - 3;
  if (count > 0) sheet.getRange(4,53,count,1).setFormulas(Array.from({length:count},(_,i) => [caseyLinkFormula_(i+4)]));
}

// New/edited names and DOBs get a link. If an onEdit already exists, call
// caseyOnEdit(e) from that handler instead of replacing it.
function caseyOnEdit(e) {
  if (!e || !e.range || e.source.getId() !== CASEY_SPREADSHEET_ID || e.range.getSheet().getSheetId() !== CASEY_SHEET_ID) return;
  if (e.range.getColumn() > 17 || e.range.getLastColumn() < 14) return;
  const start = Math.max(4,e.range.getRow());
  const end = e.range.getLastRow();
  if (end >= start) e.range.getSheet().getRange(start,53,end-start+1,1)
    .setFormulas(Array.from({length:end-start+1},(_,i) => [caseyLinkFormula_(start+i)]));
}

function caseyNorm_(value) { return String(value || '').replace(/\s+/g,' ').trim().toLowerCase(); }
function caseyYear_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value,SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),'yyyy');
  }
  const year = String(value || '').match(/(?:19|20)\d{2}/);
  return year ? year[0] : '';
}

function writeCaseyResult(result) {
  const sheet = caseySheet_();
  if (!result || result.spreadsheetId !== CASEY_SPREADSHEET_ID || result.sheetId !== CASEY_SHEET_ID ||
      !Number.isSafeInteger(result.row) || result.row < 4 || typeof result.requestId !== 'string' ||
      !/^[a-zA-Z0-9-]{8,100}$/.test(result.requestId) || typeof result.summary !== 'string' || typeof result.copy !== 'string' ||
      !result.params || !caseyNorm_(result.params.first) || !caseyNorm_(result.params.last) || !/^(19|20)\d{2}$/.test(String(result.params.yob))) {
    throw new Error('Invalid Casey result.');
  }
  if (result.summary.length > 50000 || result.copy.length > 50000) throw new Error('Result exceeds the Google Sheets cell limit; copy it from Casey manually.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const properties = PropertiesService.getDocumentProperties();
    const done = JSON.parse(properties.getProperty('casey_completed_requests') || '{}');
    if (done[result.requestId]) return {row:done[result.requestId],alreadyWritten:true};
    // Find the client again in case the log was sorted or rows were inserted.
    // Ambiguous duplicate identities are held for review rather than guessed.
    const count = sheet.getLastRow() - 3;
    const identities = count > 0 ? sheet.getRange(4,14,count,4).getValues() : [];
    const matches = [];
    identities.forEach((values,index) => {
      if (caseyNorm_(values[0]) === caseyNorm_(result.params.first) &&
          caseyNorm_(values[1]) === caseyNorm_(result.params.last) && caseyYear_(values[3]) === String(result.params.yob)) matches.push(index+4);
    });
    if (matches.length !== 1) throw new Error('Client moved, changed, or appears more than once. Results retained; resolve the duplicate or copy manually from Casey.');
    const row = matches[0];
    const output = sheet.getRange(row,54,1,2);
    if (output.getMergedRanges().length) throw new Error('BB and BC must be separate, unmerged cells.');
    // Rich text writes literal strings, including text beginning with '='.
    output.setRichTextValues([[SpreadsheetApp.newRichTextValue().setText(result.summary).build(),
      SpreadsheetApp.newRichTextValue().setText(result.copy).build()]]);
    SpreadsheetApp.flush();
    const readback = output.getValues()[0];
    if (readback[0] !== result.summary || readback[1] !== result.copy) throw new Error('Result readback did not match; results retained.');
    done[result.requestId] = row;
    const keys = Object.keys(done);
    keys.slice(0,Math.max(0,keys.length-100)).forEach(key => delete done[key]);
    properties.setProperty('casey_completed_requests',JSON.stringify(done));
    return {row:row};
  } finally { lock.releaseLock(); }
}

function connectCasey() {
  caseySheet_();
  const html = HtmlService.createHtmlOutput(`<!doctype html><html><head><base target="_top"></head><body>
    <p>Click 🐾 Casey in column BA to search. Keep this sidebar open to receive the results.</p>
    <p id="status" role="status">Waiting for the updated Casey userscript…</p>
    <button id="retry" type="button">Retry pending results</button>
    <script>
    const channel='icbincn-weekly-call-log-v1', spreadsheetId='${CASEY_SPREADSHEET_ID}', sheetId=${CASEY_SHEET_ID};
    const nonce=Array.from(crypto.getRandomValues(new Uint32Array(4)),v=>v.toString(16).padStart(8,'0')).join('');
    const seen=new Set(), failed=new Set(); let busy=false, connected=false;
    const status=document.getElementById('status');
    function send(type,requestId) { window.top.postMessage({channel,spreadsheetId,sheetId,nonce,type,requestId},'https://docs.google.com'); }
    document.getElementById('retry').onclick=()=>{failed.clear();send('poll');};
    window.addEventListener('message',event=>{
      const msg=event.data;
      if(event.origin!=='https://docs.google.com'||event.source!==window.top||!msg||msg.channel!==channel||msg.nonce!==nonce||msg.type!=='results'||!Array.isArray(msg.results))return;
      if(!connected){connected=true;status.textContent='Connected. Click Casey in BA to start a search.';}
      if(busy)return;
      const result=msg.results.find(r=>r&&r.spreadsheetId===spreadsheetId&&r.sheetId===sheetId&&!seen.has(r.requestId)&&!failed.has(r.requestId));
      if(!result)return;
      busy=true;status.textContent='Saving summary and copy text…';
      google.script.run.withSuccessHandler(reply=>{
        seen.add(result.requestId);busy=false;send('ack',result.requestId);
        status.textContent='Saved summary in BB'+reply.row+' and copy text in BC'+reply.row+'.';
      }).withFailureHandler(error=>{busy=false;failed.add(result.requestId);status.textContent=error.message+' Use Retry after resolving the issue.';}).writeCaseyResult(result);
    });
    send('poll');setInterval(()=>send('poll'),2000);
    </script></body></html>`).setTitle('Casey search results');
  SpreadsheetApp.getUi().showSidebar(html);
}
