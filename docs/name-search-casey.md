# Casey in Name and Case Search

Casey appears only during an active search. She is hidden before searching,
after Stop or Clear Log, and when Summary/Detail results appear.

The existing blank area between the entry panel and bottom button bar is
invisibly divided into three equal columns. Casey is centered vertically and
horizontally in exactly one column:

- Name search: criminal in column 1, traffic/municipal in column 2, and final
  Municourt pass in column 3. Placement reads persisted search state and updates
  immediately when that state changes, including navigation/resume.
- Case-number search: column 2 throughout, for both Case.net and Municourt.

Name-search captions beneath Casey are exactly:

- `1. Criminal Cases`
- `2. Traffic/Municipal`
- `3. Municourt`

Case-number searches do not receive a numbered pass caption. Captions share
Casey's center and hide if there is insufficient room below her.

Pass changes fade Casey and her caption out for 100 ms, reposition while
invisible, and fade in for 100 ms. The outgoing fade finishes before search
navigation; the new page fades in at its persisted pass. Stop/restart, hidden
views, and reduced motion cancel pending transitions safely. Reduced motion
changes columns immediately. The underlying walk/ground phase is preserved
within a page.

Help shows only `Version` and the installed userscript's `GM_info.script.version`
beneath its heading. It does not display a build identifier or hash.

Her width is 121% of Clear Log’s width, reflecting two successive 10% increases.
An absolute overlay leaves entry fields,
buttons, results space and the window height unchanged. She never intercepts
input. When a viewport leaves insufficient blank space, the figure stays hidden
rather than covering controls.

The approved 18-frame thinking-hand loop runs at 100 ms per frame (1.8 seconds).
The ground scrolls independently every 6.5 seconds. Pass changes retain the pose
and ground phase. Minimized/hidden views pause; reduced motion uses the original
static pose only while a search is active.

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
node tests/name-search-casey-fade.browser.cjs
node tests/case-number-override.browser.cjs
```

The browser checks require Playwright and Chromium. Set `CHROMIUM_EXECUTABLE`
when Chromium is installed at a path other than `/usr/bin/chromium`.

The updated loop inserts approved heel-contact frame 115 between revised frame 21
and frame 101. The approved raised viewer-right eyebrow follows the baked body bob. Frame 67
uses a smooth leg curve based on its neighbors, keeping its shoe and ankle fixed.
The retained static artwork, shoes, legs and ground are unchanged.
The eyebrow is translated 113 pixels right and 18 pixels up from its original
position, matching the approved placement preview in every frame. The asset manifest records exact per-frame pixel hashes.
