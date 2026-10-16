# Name Search text recovery

Summary and Detail keep independent undo and redo histories in Tampermonkey's
persistent userscript storage. New searches and ordinary Clear Log clicks retain
this history. Refreshing, navigating away, or restarting the browser retains it
as long as the userscript's storage remains intact.

- In either results pane, use Ctrl+Z (Mac: Command+Z) to undo. Undo can step back
  into that pane's text from earlier searches. The other pane stays as it is.
- Use Ctrl+Y or Ctrl+Shift+Z (Mac: Command+Shift+Z) to redo. A new edit or new
  search result replaces that pane's redo branch, as in a normal text editor.
- After an ordinary Clear Log, leave focus on that button and press Ctrl+Z
  (Mac: Command+Z) to restore the latest pair of panes. This restores text only;
  it does not restore the scraped case log or restart a search. Recovery is
  paused while a search is active.
- To discard all retained Summary and Detail text history, click **Clear Log
  five times within two seconds**. Each click still clears the current log as
  usual; the fifth also erases both undo/redo timelines. The status confirms
  that the text undo history was cleared. Earlier text cannot then be recovered.

History has no automatic expiry or fixed entry limit. Each edit stores just its
changed span (including deleted text), rather than another full copy of the
document. The five-click reset releases that storage. Browser/extension storage
limits still apply, and clearing extension data or uninstalling the userscript
can remove history. This is local retention, not a server backup or cross-device
sync. Text deleted before this update cannot be recovered retroactively.
