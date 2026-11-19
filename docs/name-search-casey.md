# Casey in Name Search

Casey sits at the bottom right above **Clear Log**. Her canvas matches that
button’s measured width and retains the approved figure proportions. The row
uses the existing blank space; the overall search window height stays fixed.

- Before a search, Casey displays the original smiling first pose.
- During Name or Case searches, she uses the approved 18-frame thinking-hand
  loop: 100 ms per frame (1.8 seconds total), with the existing body bob baked into the artwork.
- The ground scrolls separately, once every 6.5 seconds.
- Stop or Clear Log returns her to the idle pose. She hides when results appear
  so Summary and Detail retain their space, and reappears after clearing them.
- Offscreen/minimized views pause animation work. Reduced-motion preferences use
  the static pose. The mascot never intercepts input or button clicks.

All three PNG assets are embedded in the userscript. Installing the script does
not require an image server, the preview site, or additional Tampermonkey grants.
`assets/casey-name-search/manifest.json` records the frame order, source pixel
proof and asset hashes. Source artwork is lossless and stored at its native size.

After changing an approved asset and its manifest hash, regenerate with:

```sh
python scripts/build_casey_name_search_assets.py
python scripts/build_tampermonkey.py
```

Validation:

```sh
node --test tests/*.test.cjs
node tests/name-search-casey.browser.cjs
node tests/case-number-override.browser.cjs
```

The browser checks require Playwright and Chromium. Set `CHROMIUM_EXECUTABLE`
when Chromium is installed at a path other than `/usr/bin/chromium`.

The updated loop inserts approved heel-contact frame 115 between revised frame 21
and frame 101. A raised viewer-left eyebrow follows the baked body bob. Frame 67
uses a smooth leg curve based on its neighbors, keeping its shoe and ankle fixed.
The idle placeholder, shoe artwork elsewhere, ground speed and search lifecycle
are unchanged. The asset manifest records exact per-frame pixel hashes.
