# Repository Agent Rules

## Permanent update rule for `dist/ICBINCN.user.js.txt`
When Codex updates `dist/ICBINCN.user.js.txt`, it must also update the userscript `@version` and date metadata to the current date.

### Exception
Do **not** update the date/version when the requested change explicitly requires reverting `dist/ICBINCN.user.js.txt` to a previous version.
