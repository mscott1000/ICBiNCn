// Deferred source: excluded from the Tampermonkey build. See docs/deferred-features.md.
const GV_STORAGE_KEY = 'gv_batch_sender_state_v1';

let gvQueue = [];

let gvFocusedPair = null;

function gvLoadState() {try {return JSON.parse(localStorage.getItem(GV_STORAGE_KEY) || '{}') || {};} catch {return {};}}

function gvSaveFromUi() {localStorage.setItem(GV_STORAGE_KEY,JSON.stringify({phones:document.getElementById('moGvPhones')?.value || '',names:document.getElementById('moGvNames')?.value || '',lastNames:document.getElementById('moGvLastNames')?.value || '',message:document.getElementById('moGvMessage')?.value || ''}));}

function gvLines(text) {return String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);}

function gvPhone(text) {let d = String(text || '').replace(/\D/g,''); if (d.length === 11 && d.startsWith('1')) d = d.slice(1); return d.length === 10 ? d : '';}

function gvFmt(d) {return /^\d{10}$/.test(d) ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : '';}

function gvCompose(first,base) {const body = String(base || '').trim(); const f = norm(first); if (!body) return f ? `Hi ${f},` : 'Hi,'; return f ? `Hi ${f}, ${body}` : `Hi, ${body}`;}

function gvBuildQueue() {const phones = gvLines(document.getElementById('moGvPhones')?.value || ''); const first = gvLines(document.getElementById('moGvNames')?.value || ''); const last = gvLines(document.getElementById('moGvLastNames')?.value || ''); if (!phones.length) throw new Error('Enter at least one phone number.'); const parsed = phones.map((phone,idx) => ({index:idx + 1,phoneRaw:phone,phoneDigits:gvPhone(phone),phoneDisplay:gvFmt(gvPhone(phone)) || phone.trim(),firstName:norm(first[idx] || ''),lastName:norm(last[idx] || '')})); const bad = parsed.filter(x => !x.phoneDigits); if (bad.length) throw new Error(`These phone numbers could not be parsed: ${bad.map(x => x.phoneRaw).join(', ')}`); return parsed;}

function gvRenderStatus(message) {const status = document.getElementById('moGvStatus'); const preview = document.getElementById('moGvPreview'); if (message && status) status.textContent = message; else if (status && gvFocusedPair) status.innerHTML = `<strong>${escapeHtml([gvFocusedPair.firstName,gvFocusedPair.lastName].filter(Boolean).join(' ') || '(no name provided)')}</strong><br>${escapeHtml(gvFocusedPair.phoneDisplay || gvFocusedPair.phoneRaw)}<br>${gvQueue.length} pair(s) remaining in queue.`; else if (status) status.textContent = 'No pair loaded.'; if (preview) preview.textContent = gvQueue.length ? gvQueue.slice(0,5).map(item => `[${item.index}] ${[item.firstName,item.lastName].filter(Boolean).join(' ') || '(no name)'} -> ${item.phoneDisplay}`).concat(gvQueue.length > 5 ? [`...and ${gvQueue.length - 5} more.`] : []).join('\n') : '(queue preview will appear here)';}

function gvLoadPairs() {gvSaveFromUi(); gvQueue = gvBuildQueue(); gvFocusedPair = gvQueue[0] || null; gvRenderStatus();}

function gvRemoveFirstLine(id) {const el = document.getElementById(id); if (!el) return; const all = String(el.value || '').split(/\r?\n/); while (all.length && !all[0].trim()) all.shift(); if (all.length) all.shift(); el.value = all.join('\n');}

function renderGoogleVoiceAssist() {const st = gvLoadState(); addBlock('',`<div class="moFeaturePlaceholder"><div class="moNameRow" style="grid-template-columns:1fr 1fr;"><div class="moField"><label>First names (one per line)</label><textarea id="moGvNames" placeholder="Yasmine&#10;Shauron">${escapeHtml(st.names || '')}</textarea></div><div class="moField"><label>Last names (one per line)</label><textarea id="moGvLastNames" placeholder="Smith&#10;Jones">${escapeHtml(st.lastNames || '')}</textarea></div></div><div class="moNameRow" style="grid-template-columns:1fr 1fr;"><div class="moField"><label>Message body</label><textarea id="moGvMessage" placeholder="this is Mason with Tap In...">${escapeHtml(st.message || '')}</textarea></div><div class="moField"><label>Phone numbers (one per line)</label><textarea id="moGvPhones" placeholder="(314) 302-7864&#10;(314) 435-9029">${escapeHtml(st.phones || '')}</textarea></div></div><div class="moNameRowBottom" style="grid-template-columns:repeat(6,1fr);"><button class="moBtn moSearchBtn" id="moGvLoad">Load Pairs</button><button class="moBtn" id="moGvNumber">Number</button><button class="moBtn" id="moGvText">Text</button><button class="moBtn" id="moGvName">Name</button><button class="moBtn" id="moGvNext">Next</button><button class="moBtn" id="moGvClear">Clear</button></div><div class="moTextBuilderMessage" id="moGvStatus">No pair loaded.</div><pre class="moTextBuilderMessage" id="moGvPreview">(queue preview will appear here)</pre></div>`); setTimeout(() => {try {gvLoadPairs();} catch {gvRenderStatus();}},0);}
