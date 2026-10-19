#!/usr/bin/env python3
"""Import hotels from official OSM map.json exports; never collect user metadata.

Example: python scripts/import-osm-hotels.py /tmp/hotel-map-*.json \
  --retrieved-at 2026-10-19
The snapshots must come from https://api.openstreetmap.org/api/0.6/map.json.
Only named lodgings within 10 km of a confirmed venue are retained. Without a
published Booking URL, the UI offers an explicitly labelled name/location search.
"""
import argparse
import difflib
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent


def distance(a, b):
    lat, lng, other_lat, other_lng = map(math.radians, [a['lat'], a['lng'], b['lat'], b['lng']])
    return 12742 * math.asin(min(1, math.sqrt(math.sin((other_lat-lat)/2)**2 + math.cos(lat)*math.cos(other_lat)*math.sin((other_lng-lng)/2)**2)))


def name_key(name):
    text = ''.join(c for c in unicodedata.normalize('NFKD', name.lower()) if not unicodedata.combining(c))
    return ' '.join(w for w in re.findall(r'[a-z0-9]+', text) if w not in {'hotel', 'hoteles', 'hostal', 'apartahotel', 'apartamentos', 'aparthotel', 'de', 'del', 'el', 'la', 'by'})


def same_property(a, b):
    if a['id'] == b['id'] or a.get('wikidata') == b['id']:
        return True
    if distance(a, b) > .4:
        return False
    one, two = name_key(a['name']), name_key(b['name'])
    if one == two:
        return True
    # Keep neighbouring properties with different names; handle brand suffixes.
    common = set(one.split()) & set(two.split())
    return len(common) >= 2 and difflib.SequenceMatcher(None, one, two).ratio() >= .8


def read_maps(paths, venues):
    properties = {}
    kinds = {'hotel': 'Hotel', 'guest_house': 'Habitación', 'hostel': 'Habitación', 'apartment': 'Apartamento', 'motel': 'Hotel'}
    for path in paths:
        data = json.loads(Path(path).read_text())
        nodes = {e['id']: e for e in data['elements'] if e['type'] == 'node'}
        for item in data['elements']:
            tags = item.get('tags', {})
            if tags.get('tourism') not in kinds or not tags.get('name'):
                continue
            points = [nodes[n] for n in item.get('nodes', []) if n in nodes]
            if 'lat' in item:
                lat, lng = item['lat'], item['lon']
            elif points:
                lat = sum(p['lat'] for p in points)/len(points)
                lng = sum(p['lon'] for p in points)/len(points)
            else:
                continue
            hotel = {'id': f"osm-{item['type']}-{item['id']}", 'name': tags['name'], 'type': kinds[tags['tourism']], 'lat': lat, 'lng': lng}
            nearest = min(venues, key=lambda v: distance(hotel, v['location']))
            if distance(hotel, nearest['location']) > 10:
                continue
            hotel['address'] = ', '.join(filter(None, [' '.join(filter(None, [tags.get('addr:street'), tags.get('addr:housenumber')])), tags.get('addr:city') or nearest['city']]))
            hotel['sourceUrl'] = f"https://www.openstreetmap.org/{item['type']}/{item['id']}"
            hotel['wikidata'] = tags.get('wikidata')
            hotel['website'] = tags.get('website') or tags.get('contact:website')
            # Paths are accepted only when actually published in the OSM tags.
            for value in tags.values():
                for candidate in re.findall(r'https?://[^\s;]+', value):
                    url = urlsplit(candidate)
                    if url.hostname not in {'booking.com', 'www.booking.com'}:
                        continue
                    match = re.fullmatch(r'/hotel/(es/[a-zA-Z0-9_.%-]+)\.html', url.path)
                    if match:
                        hotel['bookingPath'] = match.group(1)
            properties[hotel['id']] = hotel
    return list(properties.values())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('maps', nargs='+')
    parser.add_argument('--retrieved-at', required=True)
    parser.add_argument('--output', default=str(ROOT/'src/data/real/osm-stays.json'))
    args = parser.parse_args()
    venues = [v for v in json.loads((ROOT/'src/data/venues.json').read_text()) if v['location']]
    existing = json.loads((ROOT/'src/data/real/stays.json').read_text())['hotels'] + json.loads((ROOT/'src/data/real/venue-stays.json').read_text())['hotels']
    exclusions = json.loads((ROOT/'src/data/real/osm-stays-exclusions.json').read_text())
    links = {link['id']: link for link in json.loads((ROOT/'src/data/real/published-booking-links.json').read_text())['links']}
    imported = []
    for hotel in sorted(read_maps(args.maps, venues), key=lambda h: (not bool(h.get('bookingPath')), h['name'])):
        if hotel['id'] in exclusions:
            continue
        if any(same_property(hotel, other) for other in existing + imported):
            continue
        if hotel['id'] in links:
            hotel['bookingPath'] = links[hotel['id']]['bookingPath']
            hotel['bookingSourceUrl'] = links[hotel['id']]['bookingSourceUrl']
        imported.append(hotel)
    for hotel in imported:
        # Internal deduplication hints and website are not needed in the client.
        hotel.pop('wikidata', None)
        hotel.pop('website', None)
    result = {'retrievedAt': args.retrieved_at, 'source': '© OpenStreetMap contributors', 'licence': 'ODbL-1.0', 'licenceUrl': 'https://www.openstreetmap.org/copyright', 'hotels': imported}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(f'Imported {len(imported)} real OSM lodgings, {sum(bool(h.get("bookingPath")) for h in imported)} published Booking paths.')


if __name__ == '__main__':
    main()
