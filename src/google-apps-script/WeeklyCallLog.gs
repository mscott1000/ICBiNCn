/** Lightweight result writer; buttons and searches live in Tampermonkey. */
const CASEY_SPREADSHEET_ID = '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const CASEY_SHEET_ID = 1261396864;
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Casey')
    .addItem('Connect search results','connectCasey')
    .addItem('Remove old Casey images / links','removeLegacyCaseyButtons').addToUi();
}
function caseySheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (book.getId() !== CASEY_SPREADSHEET_ID) throw new Error('Install this script in Intake 2026.');
  const sheet = book.getSheets().find(s => s.getSheetId() === CASEY_SHEET_ID);
  if (!sheet || sheet.getName() !== 'Weekly Call Log') throw new Error('Weekly Call Log tab not found.');
  return sheet;
}
function removeLegacyCaseyButtons() {
  const sheet=caseySheet_();
  sheet.getImages().filter(image=>image.getAltTextTitle().startsWith('ICBiNCn Casey ')).forEach(image=>image.remove());
  const count=sheet.getMaxRows()-3;
  if(count>0){const ranges=[];sheet.getRange(4,53,count,1).getFormulas().forEach((row,index)=>{
    if(row[0].includes('icbincn=weekly-call-log'))ranges.push('BA'+(index+4));
  });if(ranges.length)sheet.getRangeList(ranges).clearContent();}
}
// Compatibility for an earlier manually installed edit hook. No work required.
function caseyOnEdit(e) {}
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
  const html=HtmlService.createHtmlOutput(`<!doctype html><html><body>
    <p>Select a single BA cell and click the injected Casey logo. Keep this result connection open.</p>
    <p id="status" role="status">Waiting for Casey…</p><button id="retry">Retry connection / results</button>
    <script>
    const channel='icbincn-weekly-call-log-v1',spreadsheetId='${CASEY_SPREADSHEET_ID}',sheetId=${CASEY_SHEET_ID};
    const nonce=Array.from(crypto.getRandomValues(new Uint32Array(4)),v=>v.toString(16).padStart(8,'0')).join('');
    const seen=new Set(),failed=new Set();let busy=false;
    const status=document.getElementById('status');
    function send(type,requestId){window.top.postMessage({channel,spreadsheetId,sheetId,nonce,type,requestId},'https://docs.google.com');}
    document.getElementById('retry').onclick=()=>{failed.clear();send('connect');};
    window.addEventListener('message',event=>{
      const msg=event.data;
      if(event.origin!=='https://docs.google.com'||event.source!==window.top||!msg||msg.channel!==channel||msg.nonce!==nonce||msg.type!=='results'||!Array.isArray(msg.results))return;
      if(busy)return;
      const result=msg.results.find(r=>r&&r.spreadsheetId===spreadsheetId&&r.sheetId===sheetId&&!seen.has(r.requestId)&&!failed.has(r.requestId));
      if(!result){if(!failed.size)status.textContent='Connected. Ready for completed search results.';return;}
      busy=true;status.textContent='Saving summary and copy text…';
      google.script.run.withSuccessHandler(reply=>{seen.add(result.requestId);busy=false;send('ack',result.requestId);
        status.textContent='Saved BB'+reply.row+' and BC'+reply.row+'.';send('connect');
      }).withFailureHandler(error=>{busy=false;failed.add(result.requestId);status.textContent=error.message+' Use Retry after resolving the issue.';}).writeCaseyResult(result);
    });
    send('connect');google.script.host.editor.focus();
    setTimeout(()=>{if(status.textContent==='Waiting for Casey…')status.textContent='Update Tampermonkey, reload Sheets, and reopen this connection.';},10000);
    </script></body></html>`).setTitle('Casey result connection');
  SpreadsheetApp.getUi().showSidebar(html);
}
