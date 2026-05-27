# Headless Runner (Service Mode)

This folder contains a starter scaffold for running the CaseNet workflow as a **headless service** instead of a Tampermonkey userscript.

## Why this exists

The current userscript relies on Tampermonkey APIs (`GM_*`) and a browser-extension runtime. Headless execution requires replacing that runtime with service components:

- browser automation runtime (Playwright/Puppeteer)
- credential/session management
- storage adapter replacing `GM_getValue`/`GM_setValue`
- scheduler/retry/backoff
- logging + alerts

## Quick start

1. Copy `.env.example` to `.env` and fill in required values.
2. Run:

   ```bash
   python headless/service_runner.py --once
   ```

3. For repeated runs:

   ```bash
   python headless/service_runner.py --interval-seconds 900
   ```

## Credentials input behavior

If key credentials are missing, the runner prompts on stdin so you can provide them interactively at startup.

## Current status

This is a **framework scaffold**. The runner includes clear TODO boundaries for plugging in the real browser automation and parser flow from `src/tampermonkey/`.
