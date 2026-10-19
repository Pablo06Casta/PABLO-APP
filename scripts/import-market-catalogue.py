#!/usr/bin/env python3
"""Build the dated OSM grocery fallback from official bounded map.json exports.

python scripts/import-market-catalogue.py /tmp/map-*.json --retrieved-at YYYY-MM-DD
Only public shop facts within 3 km of confirmed venues are retained. Do not
supply an invented date: use the actual retrieval date of the map exports.
"""
import argparse
from datetime import date
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def distance(a, b):
    lat, lng, other_lat, other_lng = map(math.radians, [a['lat'], a['lng'], b['lat'], b['lng']])
    return 12742 * math.asin(min(1, math.sqrt(math.sin((other_lat-lat)/2)**2 + math.cos(lat)*math.cos(other_lat)*math.sin((other_lng-lng)/2)**2)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('maps', nargs='+')
    parser.add_argument('--retrieved-at', required=True, type=date.fromisoformat)
    parser.add_argument('--output', default=str(ROOT/'src/data/real/venue-markets.json'))
    parser.add_argument('--merge-from', help='Keep previously published shops, source URLs and real retrieval dates.')
    args = parser.parse_args()
    venues = [v for v in json.loads((ROOT/'src/data/venues.json').read_text()) if v['location']]
    shops, sources = {}, set()
    if args.merge_from:
        previous = json.loads(Path(args.merge_from).read_text())
        shops.update((shop['id'], shop) for shop in previous['markets'])
        sources.update(previous['sources'])
    exclusions = json.loads((ROOT/'src/data/real/market-exclusions.json').read_text())
    for key in exclusions:
        shops.pop(key, None)
    for path in args.maps:
        data = json.loads(Path(path).read_text())
        if not data.get('generator', '').startswith('openstreetmap-cgimap') or not data.get('bounds'):
            raise ValueError(f'Not an official OSM map export: {path}')
        bounds = data['bounds']
        bbox = ','.join(str(bounds[k]) for k in ['minlon', 'minlat', 'maxlon', 'maxlat'])
        sources.add('https://api.openstreetmap.org/api/0.6/map.json?bbox='+bbox)
        nodes = {e['id']: e for e in data['elements'] if e['type'] == 'node'}
        for item in data['elements']:
            tags = item.get('tags', {})
            if tags.get('shop') not in {'supermarket', 'convenience'}:
                continue
            points = [nodes[n] for n in item.get('nodes', []) if n in nodes]
            if 'lat' in item:
                lat, lng = item['lat'], item['lon']
            elif points:
                lat = sum(p['lat'] for p in points)/len(points)
                lng = sum(p['lon'] for p in points)/len(points)
            else:
                continue
            key = f"{item['type']}-{item['id']}"
            if key in exclusions:
                continue
            shop = {'id': key, 'name': tags.get('name') or tags.get('brand') or 'Tienda de alimentación', 'kind': tags['shop'], 'lat': lat, 'lng': lng}
            if not any(distance(shop, v['location']) <= 3 for v in venues):
                continue
            shop['address'] = ' '.join(filter(None, [tags.get('addr:street'), tags.get('addr:housenumber')])) or 'Dirección no disponible en OpenStreetMap'
            shop['source'] = 'osm'
            shop['sourceUrl'] = f"https://www.openstreetmap.org/{item['type']}/{item['id']}"
            shop['retrievedAt'] = args.retrieved_at.isoformat()
            shop['coverage'] = 'local'
            if tags.get('opening_hours'):
                shop['hours'] = tags['opening_hours']
            shops[shop['id']] = shop
    unique = []
    for shop in shops.values():
        existing = next((other for other in unique if other['name'].casefold() == shop['name'].casefold() and distance(other, shop) < .035), None)
        if existing:
            if existing['address'].startswith('Dirección no disponible') and not shop['address'].startswith('Dirección no disponible'):
                unique[unique.index(existing)] = shop
        else:
            unique.append(shop)
    coverage = []
    for venue in venues:
        near = [shop for shop in unique if distance(shop, venue['location']) <= 3]
        if not any(shop['kind'] == 'supermarket' for shop in near):
            raise ValueError(f'No real supermarket coverage for {venue["id"]}')
        coverage.append({'venueId': venue['id'], 'supermarkets': sum(s['kind'] == 'supermarket' for s in near), 'shops': len(near)})
    result = {'retrievedAt': args.retrieved_at.isoformat(), 'licence': 'ODbL-1.0', 'attribution': '© OpenStreetMap contributors', 'licenceUrl': 'https://www.openstreetmap.org/copyright', 'sources': sorted(sources), 'coverage': coverage, 'markets': sorted(unique, key=lambda s: s['id'])}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(f'{len(unique)} real grocery shops, {sum(s["kind"] == "supermarket" for s in unique)} supermarkets, {len(coverage)} confirmed venues.')
    for row in coverage:
        print(row)


if __name__ == '__main__':
    main()
