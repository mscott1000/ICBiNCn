from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'src' / 'tampermonkey'
OUTPUTS = [
    ROOT / 'tampermonkey-version',
    ROOT / 'ICBINCN.user.js.txt',
]

parts = sorted(SOURCE_DIR.glob('*.js'))
if not parts:
    raise SystemExit(f'No source parts found in {SOURCE_DIR}')

bundle = '\n'.join(part.read_text().rstrip() for part in parts) + '\n'

for output in OUTPUTS:
    output.write_text(bundle)
    print(f'Wrote {output.relative_to(ROOT)}')
