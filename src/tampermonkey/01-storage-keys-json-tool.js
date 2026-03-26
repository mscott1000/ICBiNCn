
  /************************************************************
   * Storage keys (JSON tool)
   ************************************************************/
  const KEY_LOG = 'mo_casenet_json_log_v1'; // array of entries
  const KEY_RUN = 'mo_casenet_json_run_v1'; // boolean
  const KEY_STOP = 'mo_casenet_json_stop_v1'; // boolean
  const KEY_STATUS = 'mo_casenet_json_status_v1'; // string
  const KEY_DEBUG = 'mo_casenet_json_debug_v1'; // array of last N debug rows
  const DEBUG_MAX = 180;

  const KEY_NAMESEARCH = 'mo_casenet_json_namesearch_state_v1';
  const KEY_UI_DRAFT = 'mo_casenet_json_ui_draft_v1';
  const KEY_TRACK_STATE = 'mo_casenet_track_state_v1';
  const KEY_TRACK_DRAFT = 'mo_casenet_track_draft_v1';
  const KEY_CASE_BATCH_DRAFT = 'mo_casenet_case_batch_draft_v1';

  const DEFAULT_CONCURRENCY = 7;

  const KEY_LAST_HTML = 'mo_casenet_json_last_html_v1'; // {ts, url, path, status, ct, respUrl, redirected, title, sig, html}
  const KEY_NET_STATS = 'mo_casenet_json_net_stats_v1'; // { byPath: { [path]: {html: n, json: n, httpErr: n} } }

  const RESULTS_READY_TIMEOUT_MS = 20000; // total time you're willing to wait
  const RESULTS_READY_POLL_MS = 250; // how often to check
  const TAB_ID_KEY = 'mo_casenet_tab_id_v1';
