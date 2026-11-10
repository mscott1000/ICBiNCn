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

The ineligible image has no surrounding editor headings or card frames, and “Cases we CANNOT request” is centered.

Images contain entered summaries rather than the message's added greeting, explanation, or closing. Only ineligible images shorten charges: charge text after the first colon and before `- warrant` or `- open (no warrant found)` is capped at 12 characters, followed by `. . .` if truncated. Case identifiers and status suffixes remain intact. The text message and entered summaries are not modified.

## Editing and exporting

For the **ineligible image**, case content and headings are read-only. “Next Steps for You” starts with one blank field. Type directly into that field; **Add next step** creates another blank field. Fields stay in place and expand vertically to fit their content, with faint dividers between entries. Only three buttons appear: **Add next step**, **Copy Image**, and **Download for Email**. The latter downloads a JPEG for attaching to an email; it does not send email.

For the **eligible image**, select a text box in the preview, then edit **Selected text**. Drag a box to reposition it; keyboard users can focus a box and press Enter to edit, or use arrow keys to move it. Add and remove text boxes with the corresponding controls. Its next-step slots start blank.

**Copy Image** copies a rendered PNG through the browser's image clipboard. Browser clipboard permission may be required; errors appear below the controls. **Download JPG** (eligible) and **Download for Email** (ineligible) download the edited image as a high-resolution JPEG. Selection outlines, entry-field placeholders, and editing controls are omitted from exports. Images render locally without an image service or external fonts.

Each image has an independent draft. Edits survive message rerendering, such as toggling case-data display. Changing the source summaries regenerates the affected image. **Reset image** on the eligible image discards its edits after confirmation. Drafts last for the current Text Builder session and are not persisted across page reloads.

## Validation

Run `node --test tests/*.test.cjs` for data routing, summary truncation, layout models, and existing behavior. Run `node tests/constructed-infographics.browser.cjs` with Playwright and Chromium installed for the mixed flow, editing, dragging, image encoding, download, clipboard, and panel checks. Set `INFOGRAPHIC_TEST_SCREENSHOT` to save an optional browser screenshot.
