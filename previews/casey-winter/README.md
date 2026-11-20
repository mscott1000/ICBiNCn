# Casey winter skin — stored, inactive

The winter skin is stored for a later seasonal swap and is not enabled or embedded in the installable userscript. Only the 10-pixel lift and revised pass captions are active changes. A November 30 reminder was requested in the originating chat.

- `index.html`: Original/Winter switch, play/pause, and actual-size/2× inspection across the three pass positions.
- `standalone.html`: self-contained offline preview with both skins embedded. Open in a browser.
- `build-winter-skin.cjs`: deterministic canvas assembly using the original 18-frame sprite, original body-bob values, generated hat accessory, and a snow ground layer. Requires Playwright and Chromium; no original files are overwritten.
- `../../assets/casey-name-search/skins/original.json`: records the existing approved animation as Original, with its original asset hashes.
- `../../assets/casey-name-search/skins/winter/`: separate preview assets and manifest. Original body pixels below the accessory region remain byte-identical in every frame; the frame count, pose sequence, frame timing, and scrolling period are unchanged.

The placement adjustment lifts the figure/ground/caption layer by 10 rendered screen pixels, accounting for UI scale. Only figure captions change to `1/3 - Criminal`, `2/3 - Traffic/Municipal`, and `3/3 - Municourt`. Status-bar messages are untouched.

The hat was generated as a separate accessory using the existing Casey artwork as its style reference. The figure was not redrawn. Winter assets are not referenced by or embedded into the production userscript.
