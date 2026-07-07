# Jotform table visual-change instructions for future Codex agents

When a requested change visually alters Jotform table rows or columns, first analyze the repository's existing captured Jotform table HTML/data-row examples before editing selectors, layout logic, or display transformations.

Current reference files include:

- `data/jotform-captures/row-data-first.html`
- `data/jotform-captures/row-data-second.html`
- `data/jotform-captures/tab-row.html`

Use those files to verify the relevant row, cell, header, data attribute, and nested text structure. If the existing repository data is not sufficient to accurately identify the affected Jotform DOM structure or to make the requested visual change safely, stop and prompt the Codex user for more representative Jotform table HTML/data before changing implementation.
