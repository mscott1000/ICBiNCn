# Repository Agent Rules

## Permanent update rule for `dist/ICBINCN.user.js.txt`
When Codex updates `dist/ICBINCN.user.js.txt`, it must also update the userscript `@version` and date metadata to the current date.

Codex must also update the Tampermonkey userscript title (`@name`) so its trailing version-style date matches the updated `@version` date in `M.DD` / `MM.DD` format without a leading zero for the month. For example, when `@version` is updated to `2026-05-29`, `@name` must be updated to `ICBiNCn 5.29`.

### Exception
Do **not** update the date/version or title when the requested change explicitly requires reverting `dist/ICBINCN.user.js.txt` to a previous version.
