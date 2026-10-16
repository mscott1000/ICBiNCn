/************************************************************
 * Persistent, independent Summary / Detail undo timelines
 ************************************************************/
  const NAME_OUTPUT_FIELDS = {moNsSummaryOutput:'summary',moNsCopyOutput:'copy'};
  let nameOutputClearClicks = [];

  function loadNameOutputHistory() {
    const saved = loadJson(KEY_NAMESEARCH_HISTORY,null);
    if (saved?.summary && saved?.copy) return saved;
    // Adopt an existing installation's current text without changing its display.
    const output = loadJson(KEY_NAMESEARCH_OUTPUT,null);
    const field = (value) => ({value:String(value || ''),past:[],future:[]});
    return {summary:field(output?.summary),copy:field(output?.copy),available:!!output};
  }

  function rememberNameOutputField(field,value) {
    const before = field.value, after = String(value || '');
    if (before === after) return;
    let at = 0, end = 0;
    while (at < before.length && at < after.length && before[at] === after[at]) at++;
    while (end < before.length - at && end < after.length - at &&
           before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
    // Store only the changed span, including removed text needed to undo deletion.
    field.past.push({at,removed:before.slice(at,before.length - end),inserted:after.slice(at,after.length - end)});
    field.future = [];
    field.value = after;
  }

  function saveNameSearchOutput(output) {
    const history = loadNameOutputHistory();
    if (output) {
      rememberNameOutputField(history.summary,output.summary);
      rememberNameOutputField(history.copy,output.copy);
      history.available = true;
    }
    // Hiding results for a search or ordinary Clear Log must not erase history.
    saveJson(KEY_NAMESEARCH_HISTORY,history);
    saveJson(KEY_NAMESEARCH_OUTPUT,output);
  }

  function clearNameOutputHistory() {
    saveJson(KEY_NAMESEARCH_HISTORY,null);
  }

  function registerNameOutputClearClick(now = performance.now()) {
    nameOutputClearClicks = nameOutputClearClicks.filter((time) => now - time <= 2000);
    nameOutputClearClicks.push(now);
    if (nameOutputClearClicks.length < 5) return false;
    nameOutputClearClicks = [];
    return true;
  }

  function undoNameOutput(fieldName,redo = false) {
    const history = loadNameOutputHistory();
    const output = loadJson(KEY_NAMESEARCH_OUTPUT,null);
    // Immediately after Clear Log, undo restores the latest pair of panes first.
    if (!output) {
      if (redo || !history.available || loadNameState()?.active) return null;
      const restored = {summary:history.summary.value,copy:history.copy.value};
      saveJson(KEY_NAMESEARCH_OUTPUT,restored);
      return {output:restored,restored:true};
    }
    const field = history[fieldName];
    if (!field) return null;
    const from = redo ? field.future : field.past;
    const patch = from.pop();
    if (!patch) return null;
    const remove = redo ? patch.removed : patch.inserted;
    const insert = redo ? patch.inserted : patch.removed;
    field.value = field.value.slice(0,patch.at) + insert + field.value.slice(patch.at + remove.length);
    (redo ? field.past : field.future).push(patch);
    output[fieldName] = field.value;
    saveJson(KEY_NAMESEARCH_HISTORY,history);
    saveJson(KEY_NAMESEARCH_OUTPUT,output);
    return {output,caret:patch.at + insert.length};
  }

  function handleNameOutputUndo(event,redo) {
    if (appView !== 'name' || event.isComposing) return;
    const target = event.target;
    const field = NAME_OUTPUT_FIELDS[target?.id];
    const output = loadJson(KEY_NAMESEARCH_OUTPUT,null);
    // Leave name inputs, other tools, and the surrounding website's undo alone.
    if (!field && (output || target?.matches?.('input,textarea,select,[contenteditable]'))) return;
    const result = undoNameOutput(field || 'summary',redo);
    if (field || result) event.preventDefault();
    if (!result) {
      if (field && output) target.value = output[field] || '';
      return;
    }
    if (result.restored) {
      render();
      document.getElementById('moNsSummaryOutput')?.focus();
      uiStatus('Previous results restored');
    } else {
      target.value = result.output[field];
      target.setSelectionRange(result.caret,result.caret);
    }
  }
