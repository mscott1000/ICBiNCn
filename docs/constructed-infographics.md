# Constructed Infographics

Text Builder's Constructed Message screen displays editable infographics beside the message for these Post-Research Reply paths:

- **CanDo: Everything:** eligible infographic.
- **CanDo + Can’tDo:** eligible and ineligible infographics. After the eligible summary, select one or more reasons and enter each reason's summary. Confirm each entry, then complete Address as before.
- **Can'tDo: Multiple Reasons:** ineligible infographic with the selected reason subsections.
- **Individual Can'tDo paths:** ineligible infographic for that reason.

The eligible image contains “Cases we CAN request” and “Next Steps for TIC.” Court headings come from the entered Summary; multiple courts retain their grouping. The ineligible image contains “Cases we CANNOT request” and “Next Steps for You,” with reason headings in this order:

1. Repeat Attempt
2. Initial Warrant
3. Private Attorney
4. St. Louis County Municipal Court (Fresh Start Friday)
5. Recent FTA, Not a Warrant Yet
6. Not in TIC Network (Out of Network)

Both images have no surrounding editor headings or card frames, and both section headings are centered. Each case heading has a thin text-width underline. Each next-step heading has a full-width demarcation below it, without a direct text underline. Both layouts use larger bold headings, muted uppercase court labels, and fine separators between groups. The eligible case panel is pale green; the ineligible panel is pale blush.

Images contain entered summaries rather than the message's added greeting, explanation, or closing. Each court heading has its own table beneath it, including when there is only one court. Court groups retain first-appearance order from Summary; repeated headings within the same reason are merged into that court's table. Ineligible reason groups retain their existing order.

The three table columns are **Case Number**, **Warrant Found?**, and **License Hold?**. Case Number contains the case number and charge text before the status suffix, without the bullet or license-hold annotation. Table cells all use the same white background. Headers are vertically centered; Case Number stays left aligned, while Warrant Found? and License Hold? are horizontally centered with widths measured to fit on one line. Long case text wraps, and row heights expand; the old 12-character charge cap no longer applies to either infographic. An entry containing `- open (no warrant found)` shows **No** for Warrant Found?, while `- warrant` shows **Yes**. An open marker takes precedence if both occur. A missing/unrecognized warrant status shows **—** rather than inventing a status. License Hold? shows **Yes** when `hold placed on license` occurs, otherwise **No**. Matching is case-insensitive. Unstructured notes without a case-number colon remain visible above the associated table. Original text-message summaries are not modified.

## Editing and exporting

Both images keep case content and headings read-only. “Next Steps for TIC” (eligible) and “Next Steps for You” (ineligible) each start with one blank field. Type directly into that field; **Add next step** creates another blank field. Fields stay in place and expand vertically to fit their content, with faint dividers between entries. Each image has only three buttons: **Add next step**, **Copy Image**, and **Download for Email**. The latter downloads a JPEG for attaching to an email; it does not send email.

**Copy Image** copies a rendered PNG through the browser's image clipboard. Browser clipboard permission may be required; errors appear below the controls. **Download for Email** downloads the edited image as a high-resolution JPEG. Entry-field placeholders and editing controls are omitted from exports. Images render locally using the bundled Inter typeface: regular for case text and next steps, bold for headings and court labels. Inter loads from embedded font bytes before layout or export; no network font request or locally installed Inter is required. If loading fails, the UI reports the error instead of generating an image with a substitute font. The preview protects Inter typography from host-page CSS so font family, size, weight, and spacing match Canvas exports.

Each image has an independent draft. Edits survive message rerendering, such as toggling case-data display. Changing the source summaries regenerates the affected image. Drafts last for the current Text Builder session and are not persisted across page reloads.

## Validation

Run `node --test tests/*.test.cjs` for data routing, table status parsing, court grouping, wrapping, layout models, and existing behavior. Run `node tests/constructed-infographics.browser.cjs` with Playwright and Chromium installed for the mixed flow, direct next-step editing, fixed field positions, image encoding, download, clipboard, and panel checks. Set `INFOGRAPHIC_TEST_SCREENSHOT` to save an optional browser screenshot.

## Bundled typeface

`assets/fonts/Inter-Variable.ttf` is derived from Google Fonts’ Inter variable font, with optical size pinned to 14 for consistent SVG and Canvas measurement. Weight remains variable, with 400 and 700 used by the infographic. The original source is https://github.com/google/fonts/tree/main/ofl/inter and the SIL Open Font License is included at `assets/fonts/OFL-Inter.txt`. The userscript embeds the same font bytes directly in its infographic module.
