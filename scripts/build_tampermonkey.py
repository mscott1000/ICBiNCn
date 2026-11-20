from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'src' / 'tampermonkey'
OUTPUTS = [
    ROOT / 'dist' / 'ICBINCN.user.js.txt',
]

# Only active modules are bundled. src/deferred/ is retained for future development.
parts = sorted(SOURCE_DIR.glob('*.js'))
if not parts:
    raise SystemExit(f'No source parts found in {SOURCE_DIR}')

# Keep the permanent user-provided introduction ahead of userscript metadata.
introduction = SOURCE_DIR / '00-introduction.js'
if not introduction.is_file() or parts[0] != introduction:
    raise SystemExit('The permanent 00-introduction.js header must exist and be the first source part')

bundle = '\n'.join(part.read_text().rstrip() for part in parts) + '\n'

for output in OUTPUTS:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(bundle)
    print(f'Wrote {output.relative_to(ROOT)}')
