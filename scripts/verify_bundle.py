from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import hashlib, json

root = Path(__file__).resolve().parent.parent / 'WordDefense/Resources/www'
manifest = json.loads((Path(__file__).parent / 'bundle-sha256.json').read_text())
for name, expected in manifest.items():
    file = root / name
    if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != expected:
        raise SystemExit('Bundle mismatch: ' + name)
db = json.loads((root / 'weekend/data/song-db.json').read_text(encoding='utf8'))
assert db['revision'] == 56 and len(db['songs']) == 9
for song in db['songs']:
    assert hashlib.sha256((root/'weekend'/song['audio']['src']).read_bytes()).hexdigest() == song['audio']['sha256']
class References(HTMLParser):
    def __init__(self): super().__init__(); self.files = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get('src') if tag == 'script' else attrs.get('href') if tag == 'link' and attrs.get('rel') == 'stylesheet' else None
        if value and not urlsplit(value).scheme: self.files.append(urlsplit(value).path)
for page in ['weekend/index.html','weekend/home/index.html']:
    file = root/page
    parser = References(); parser.feed(file.read_text(encoding='utf8'))
    for name in parser.files:
        assert (file.parent/name).is_file(), name
assert (root/'weekend/assets/hud-glow-v54.png').is_file()
print('Verified bundled rhythm v56, 9 source audio hashes, scripts and styles')
