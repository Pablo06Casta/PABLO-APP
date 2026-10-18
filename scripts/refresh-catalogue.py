"""Refresh the CC0 hotel catalogue. Python 3; no platform credentials or scraping.

Usage: python scripts/refresh-catalogue.py [saved-sparql-response.json]
Photographs are used only when Commons supplies attribution and a free licence.
"""
import concurrent.futures
import html
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUERY = '''SELECT ?hotel ?hotelLabel ?booking ?numeric ?coord ?image WHERE {
 ?hotel wdt:P17 wd:Q29; wdt:P625 ?coord; wdt:P31 wd:Q27686 .
 { ?hotel wdt:P10532 ?numeric } UNION { ?hotel wdt:P3607 ?booking }
 FILTER NOT EXISTS { ?hotel wdt:P576 ?closed }
 OPTIONAL { ?hotel wdt:P3607 ?booking } OPTIONAL { ?hotel wdt:P10532 ?numeric }
 OPTIONAL { ?hotel wdt:P18 ?image }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}'''

def request(endpoint, params):
    encoded = urllib.parse.urlencode(params)
    args = ['--data', encoded, endpoint] if endpoint.startswith('https://commons.') else [endpoint + '?' + encoded]
    result = subprocess.run(['curl', '--fail', '--silent', '--show-error',
                             '--location', '--max-time', '45', *args],
                            capture_output=True, check=True)
    return json.loads(result.stdout)

def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', value)).strip()

raw = json.loads(pathlib.Path(sys.argv[1]).read_text()) if len(sys.argv) > 1 else request(
    'https://query.wikidata.org/sparql', {'query': QUERY, 'format': 'json'})
hotels = {}
for row in raw['results']['bindings']:
    val = lambda k: row.get(k, {}).get('value', '')
    if 'kind' in row and not val('kind').endswith('/Q27686'):
        continue
    qid = val('hotel').split('/')[-1]
    lng, lat = map(float, val('coord')[6:-1].split())
    if not re.fullmatch(r'Q\d+', qid) or not val('hotelLabel') or val('hotelLabel') == qid:
        continue
    hotel = hotels.setdefault(qid, dict(id=qid, name=val('hotelLabel'), lat=lat, lng=lng))
    if re.fullmatch(r'\d+', val('numeric')):
        hotel['bookingId'] = val('numeric')
    if re.fullmatch(r'es/[a-zA-Z0-9._-]+', val('booking')):
        hotel['bookingPath'] = val('booking')
    if val('image'):
        hotel['file'] = urllib.parse.unquote(val('image').split('Special:FilePath/')[-1])

files = sorted({h['file'] for h in hotels.values() if 'file' in h})
photos = {}
def photo_batch(batch):
    time.sleep(0.3)
    try:
        data = request('https://commons.wikimedia.org/w/api.php', dict(
            action='query', titles='|'.join('File:' + name for name in batch),
            prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=640, format='json'))
    except (subprocess.CalledProcessError, ValueError):
        print(f'Commons unavailable for {len(batch)} photos; keeping those hotels without a photograph.', file=sys.stderr)
        return {}
    result = {}
    for page in data.get('query', {}).get('pages', {}).values():
        info = page.get('imageinfo', [{}])[0]
        meta = info.get('extmetadata', {})
        get = lambda k: plain(meta.get(k, {}).get('value', ''))
        licence, author = get('LicenseShortName'), get('Artist')
        url = info.get('thumburl', '')
        if not author or not licence or urllib.parse.urlsplit(url).hostname not in ['upload.wikimedia.org', 'thumb.wikimedia.org']:
            continue
        if not any(licence.startswith(p) for p in ['CC BY', 'CC0', 'Public domain']):
            continue
        result[page['title'][5:]] = dict(url=url, author=author, licence=licence,
            licenceUrl=meta.get('LicenseUrl', {}).get('value', ''),
            source=info['descriptionurl'])
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    for result in pool.map(photo_batch, [files[i:i+20] for i in range(0, len(files), 20)]):
        photos.update(result)
        time.sleep(0.5)
for hotel in hotels.values():
    filename = hotel.pop('file', '')
    if filename in photos:
        hotel['photo'] = photos[filename]
result = dict(retrievedAt=time.strftime('%Y-%m-%d', time.gmtime()),
    source='https://www.wikidata.org/', licence='CC0-1.0',
    hotels=list(hotels.values()))
target = ROOT / 'src/data/real/stays.json'
target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{len(hotels)} real hotels; {sum("photo" in h for h in hotels.values())} credited photographs; {target}')
