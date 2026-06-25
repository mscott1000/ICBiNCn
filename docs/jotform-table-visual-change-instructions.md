# Jotform table visual-change instructions for future Codex agents

When a requested change visually alters Jotform table rows or columns, first analyze the repository's existing captured Jotform table HTML/data-row examples before editing selectors, layout logic, or display transformations.

Current reference files include:

- `jotform-row-data-first`
- `jotform-row-data-second`

Use those files to verify the relevant row, cell, header, data attribute, and nested text structure. If the existing repository data is not sufficient to accurately identify the affected Jotform DOM structure or to make the requested visual change safely, stop and prompt the Codex user for more representative Jotform table HTML/data before changing implementation.
