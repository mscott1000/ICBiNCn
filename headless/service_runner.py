#!/usr/bin/env python3
"""Headless service scaffold for the ICBINCN workflow.

This file provides a production-oriented structure for migrating from Tampermonkey
runtime assumptions to a headless worker process.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional
from urllib import request


ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"


@dataclass
class Settings:
    endpoint: str
    max_retries: int = 3
    backoff_base_seconds: int = 2
    headless_browser: bool = True


class JsonStorage:
    """Minimal stand-in for GM_setValue / GM_getValue."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def read(self) -> Dict[str, object]:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def write(self, payload: Dict[str, object]) -> None:
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def prompt_if_missing(name: str, secret: bool = False) -> Optional[str]:
    value = os.getenv(name)
    if value:
        return value
    prompt = f"Missing {name}. Enter now (leave blank to skip): "
    if secret:
        try:
            import getpass

            entered = getpass.getpass(prompt)
        except Exception:
            entered = input(prompt)
    else:
        entered = input(prompt)
    entered = entered.strip()
    if entered:
        os.environ[name] = entered
        return entered
    return None


def build_settings() -> Settings:
    endpoint = prompt_if_missing("GOOGLE_SHEETS_ENDPOINT", secret=False)
    if not endpoint:
        raise RuntimeError("GOOGLE_SHEETS_ENDPOINT is required.")

    for key in (
        "X_USERNAME",
        "X_PASSWORD",
        "INSTAGRAM_USERNAME",
        "INSTAGRAM_PASSWORD",
        "FACEBOOK_USERNAME",
        "FACEBOOK_PASSWORD",
        "GOOGLE_USERNAME",
        "GOOGLE_PASSWORD",
    ):
        prompt_if_missing(key, secret=key.endswith("_PASSWORD"))

    return Settings(
        endpoint=endpoint,
        max_retries=int(os.getenv("MAX_RETRIES", "3")),
        backoff_base_seconds=int(os.getenv("BACKOFF_BASE_SECONDS", "2")),
        headless_browser=os.getenv("HEADLESS_BROWSER", "true").lower() == "true",
    )


def run_scrape_cycle(storage: JsonStorage) -> Dict[str, object]:
    """Placeholder scrape cycle.

    TODO: Replace this with Playwright/Puppeteer-driven workflow and adapt parser
    logic from src/tampermonkey modules.
    """
    state = storage.read()
    count = int(state.get("cycle_count", 0)) + 1
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "cycle_count": count,
        "last_cycle_utc": now,
        "records": [],
        "status": "placeholder",
    }
    storage.write(payload)
    return payload


def post_json(endpoint: str, payload: Dict[str, object]) -> None:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=30) as resp:
        _ = resp.read()


def run_once(settings: Settings, storage: JsonStorage) -> None:
    payload = run_scrape_cycle(storage)
    post_json(settings.endpoint, payload)
    print(f"[{datetime.now(timezone.utc).isoformat()}] cycle complete")


def run_with_retries(settings: Settings, storage: JsonStorage) -> None:
    for attempt in range(1, settings.max_retries + 1):
        try:
            run_once(settings, storage)
            return
        except Exception as exc:
            if attempt >= settings.max_retries:
                raise
            delay = settings.backoff_base_seconds * (2 ** (attempt - 1))
            print(f"attempt {attempt} failed: {exc}; retrying in {delay}s", file=sys.stderr)
            time.sleep(delay)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run one cycle and exit")
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=0,
        help="Run continuously using this sleep interval",
    )
    return parser.parse_args()


def main() -> int:
    load_dotenv(ENV_FILE)
    args = parse_args()
    settings = build_settings()
    storage = JsonStorage(ROOT / "runtime_state.json")

    if args.once or args.interval_seconds <= 0:
        run_with_retries(settings, storage)
        return 0

    while True:
        run_with_retries(settings, storage)
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
