#!/usr/bin/env python3
"""Expand CERCA's public establishment catalogues once per day.

The first run adds the verified Fuente del Rey venue in Soria, ten nearby OSM
lodgings and five nearby OSM fuel stations selected from the public snapshot
checked on 2026-10-20. Later runs rotate through confirmed venues and import a
small bounded OSM area. Unknown commercial facts are never invented.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = "CERCA/0.2 (personal badminton travel project)"

SORIA_VENUE = {
    "id": "soria-fuente-del-rey",
    "city": "Soria",
    "region": "Castilla y León",
    "name": "Polideportivo Fuente del Rey",
    "location": {"lat": 41.7705525, "lng": -2.4685633},
    "status": "confirmed",
    "sourceUrl": "https://www.openstreetmap.org/way/271142947",
    "verifiedAt": "2026-10-20",
    "address": "Camino de la Fuente del Rey, 42000 Soria",
}

SORIA_LODGINGS = [
    ("osm-node-6449351968", "Arévacos", "Habitación", 41.7697071, -2.4660203, "Dirección no disponible en OpenStreetMap"),
    ("osm-node-6449351969", "Ábaco", "Habitación", 41.7700539, -2.4657103, "Dirección no disponible en OpenStreetMap"),
    ("osm-way-743165736", "Hostal Vitorina", "Hotel", 41.76999472, -2.465721325, "Paseo de la Florida 35, Soria"),
    ("osm-way-743165735", "Hostal Santa Bárbara", "Hotel", 41.769127983333334, -2.4708293833333332, "Paseo de Santa Bárbara 5, Soria"),
    ("osm-way-743165734", "Hotel Alba", "Hotel", 41.76967845, -2.4720621333333335, "Paseo de Santa Bárbara 13, Soria"),
    ("osm-node-369314483", "Hostal Eras de Santa Bárbara", "Hotel", 41.7713304, -2.4734909, "Dirección no disponible en OpenStreetMap"),
    ("osm-node-671265835", "Hostal Ruiz", "Habitación", 41.7660275, -2.4682369, "Dirección no disponible en OpenStreetMap"),
    ("osm-node-9183740158", "El Rincón de Gala", "Hotel", 41.7668877, -2.472433, "Calle de Venerable Palafox 9, Soria"),
    ("osm-node-6991633314", "Abaster", "Hotel", 41.76553, -2.4660309, "Dirección no disponible en OpenStreetMap"),
    ("osm-node-7086788091", "Hostel Soria", "Hotel", 41.7662321, -2.4739282, "Calle de las Navas de Tolosa 21, Soria"),
]

SORIA_FUEL = [
    ("node-287007875", "Ballenoil San Andrés", 41.7612764, -2.478245, "Coordenadas publicadas en OpenStreetMap · Soria", "Mo-Su 07:00-23:00"),
    ("way-324987298", "E. Leclerc", 41.7720653, -2.4857330333333336, "Calle J 290, 42005 Soria", None),
    ("node-9808044919", "Petroprix", 41.7687523, -2.4858322, "Avenida de Valladolid 62, Soria", None),
    ("way-1418315206", "Gas Home", 41.77205563333334, -2.4883827333333333, "Coordenadas publicadas en OpenStreetMap · Soria", None),
    ("node-287007879", "Estación de Servicio Moeve Las Casas", 41.7849984, -2.4755772, "Coordenadas publicadas en OpenStreetMap · Soria", "Mo-Su 07:00-23:00"),
]

SORIA_MARKETS = [
    ("way-1289595741", "E. Leclerc", "supermarket", 41.770100760000005, -2.46676262, "Calle Enrique García Carrilero 5", "09:00-14:30,17:00-20:30"),
    ("node-11225228162", "Dia", "supermarket", 41.7674495, -2.4674895, "Calle Clemente Sáenz 2", "Mo-Sa 09:00-21:00"),
    ("way-1370042474", "Mercadona", "supermarket", 41.77202867777778, -2.4734070666666668, "Dirección no disponible en OpenStreetMap", "Mo-Sa 09:00-21:30"),
    ("node-13435283435", "Magazin Rumanesc Soria", "supermarket", 41.7651975, -2.4702907, "Calle Sagunto 8", None),
    ("node-7140274232", "Alcampo", "supermarket", 41.7654685, -2.4655967, "Dirección no disponible en OpenStreetMap", None),
]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize(value: str) -> str:
    text = "".join(
        character
        for character in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(character)
    )
    return " ".join(re.findall(r"[a-z0-9]+", text))


def distance(first, second) -> float:
    lat, lng, other_lat, other_lng = map(
        math.radians,
        [first["lat"], first["lng"], second["lat"], second["lng"]],
    )
    return 12742 * math.asin(
        min(
            1,
            math.sqrt(
                math.sin((other_lat - lat) / 2) ** 2
                + math.cos(lat)
                * math.cos(other_lat)
                * math.sin((other_lng - lng) / 2) ** 2
            ),
        )
    )


def bootstrap_soria(root: Path, today: str) -> dict[str, int]:
    venues_path = root / "src/data/venues.json"
    stays_path = root / "src/data/real/osm-stays.json"
    fuel_path = root / "src/data/real/fuel-references.json"
    markets_path = root / "src/data/real/venue-markets.json"
    venues = read_json(venues_path)
    stays = read_json(stays_path)
    fuel = read_json(fuel_path)
    markets = read_json(markets_path)

    venue_added = 0
    if not any(venue["id"] == SORIA_VENUE["id"] for venue in venues):
        venues.append(SORIA_VENUE)
        venue_added = 1

    stay_ids = {stay["id"] for stay in stays["hotels"]}
    stays_added = 0
    for lodging_id, name, lodging_type, lat, lng, address in SORIA_LODGINGS:
        if lodging_id not in stay_ids:
            osm_type, osm_id = lodging_id.removeprefix("osm-").split("-", 1)
            stays["hotels"].append(
                {
                    "id": lodging_id,
                    "name": name,
                    "type": lodging_type,
                    "lat": lat,
                    "lng": lng,
                    "address": address,
                    "sourceUrl": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
                    "retrievedAt": today,
                }
            )
            stays_added += 1

    fuel_keys = {
        (normalize(station["destination"]), normalize(station["name"]), normalize(station["address"]))
        for station in fuel["stations"]
    }
    fuel_added = 0
    for osm_id, name, lat, lng, address, hours in SORIA_FUEL:
        key = (normalize("Soria"), normalize(name), normalize(address))
        if key in fuel_keys:
            continue
        osm_type, numeric_id = osm_id.split("-", 1)
        station = {
            "destination": "Soria",
            "venueHint": "Fuente del Rey",
            "name": name,
            "address": address,
            "lat": lat,
            "lng": lng,
            "sourceUrl": f"https://www.openstreetmap.org/{osm_type}/{numeric_id}",
            "retrievedAt": today,
        }
        if hours:
            station["hours"] = hours
        fuel["stations"].append(station)
        fuel_added += 1

    market_ids = {market["id"] for market in markets["markets"]}
    markets_added = 0
    for osm_id, name, kind, lat, lng, address, hours in SORIA_MARKETS:
        if osm_id in market_ids:
            continue
        osm_type, numeric_id = osm_id.split("-", 1)
        market = {
            "id": osm_id,
            "name": name,
            "kind": kind,
            "lat": lat,
            "lng": lng,
            "address": address,
            "source": "osm",
            "sourceUrl": f"https://www.openstreetmap.org/{osm_type}/{numeric_id}",
            "retrievedAt": today,
            "coverage": "local",
        }
        if hours:
            market["hours"] = hours
        markets["markets"].append(market)
        markets_added += 1
    if not any(row["venueId"] == SORIA_VENUE["id"] for row in markets["coverage"]):
        markets["coverage"].append(
            {"venueId": SORIA_VENUE["id"], "supermarkets": 5, "shops": 5}
        )
    soria_osm_source = "https://api.openstreetmap.org/api/0.6/map.json?bbox=-2.4886,41.7505,-2.4486,41.7905"
    if soria_osm_source not in markets["sources"]:
        markets["sources"].append(soria_osm_source)

    stays["hotels"].sort(key=lambda item: item["id"])
    fuel["scope"] = (
        "Referencias por localidad. Las entradas con coordenadas y sourceUrl proceden de "
        "OpenStreetMap; comprueba ruta, apertura y precios antes de desplazarte."
    )
    write_json(venues_path, venues)
    write_json(stays_path, stays)
    write_json(fuel_path, fuel)
    markets["markets"].sort(key=lambda item: item["id"])
    markets["coverage"].sort(key=lambda item: item["venueId"])
    markets["sources"].sort()
    write_json(markets_path, markets)
    return {
        "venues": venue_added,
        "lodgings": stays_added,
        "fuel": fuel_added,
        "markets": markets_added,
    }


def element_position(element, nodes):
    if "lat" in element and "lon" in element:
        return element["lat"], element["lon"]
    points = [nodes[node_id] for node_id in element.get("nodes", []) if node_id in nodes]
    points = [point for point in points if "lat" in point and "lon" in point]
    if not points:
        return None
    return (
        sum(point["lat"] for point in points) / len(points),
        sum(point["lon"] for point in points) / len(points),
    )


def fetch_local_osm(location):
    delta = 0.012
    bbox = ",".join(
        map(
            str,
            [
                location["lng"] - delta,
                location["lat"] - delta,
                location["lng"] + delta,
                location["lat"] + delta,
            ],
        )
    )
    url = "https://api.openstreetmap.org/api/0.6/map.json?" + urlencode({"bbox": bbox})
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=45) as response:
        data = json.load(response)
    if not str(data.get("generator", "")).startswith("openstreetmap-cgimap"):
        raise ValueError("La respuesta no es una exportación oficial de OpenStreetMap")
    return data, url


def expand_venue(root: Path, venue: dict, today: str) -> dict[str, int]:
    data, source = fetch_local_osm(venue["location"])
    nodes = {item["id"]: item for item in data["elements"] if item["type"] == "node"}
    stays_path = root / "src/data/real/osm-stays.json"
    fuel_path = root / "src/data/real/fuel-references.json"
    markets_path = root / "src/data/real/venue-markets.json"
    stays = read_json(stays_path)
    fuel = read_json(fuel_path)
    markets = read_json(markets_path)
    existing_stay_ids = {stay["id"] for stay in stays["hotels"]}
    existing_fuel_sources = {
        station.get("sourceUrl") for station in fuel["stations"] if station.get("sourceUrl")
    }
    kinds = {
        "hotel": "Hotel",
        "guest_house": "Habitación",
        "hostel": "Habitación",
        "apartment": "Apartamento",
        "motel": "Hotel",
    }
    lodging_candidates = []
    fuel_candidates = []
    market_candidates = []
    for element in data["elements"]:
        tags = element.get("tags", {})
        position = element_position(element, nodes)
        if not position:
            continue
        lat, lng = position
        point = {"lat": lat, "lng": lng}
        distance_km = distance(venue["location"], point)
        source_url = f"https://www.openstreetmap.org/{element['type']}/{element['id']}"
        address = " ".join(
            part for part in [tags.get("addr:street"), tags.get("addr:housenumber")] if part
        ) or "Dirección no disponible en OpenStreetMap"
        if tags.get("tourism") in kinds and tags.get("name") and distance_km <= 10:
            lodging_candidates.append(
                (
                    distance_km,
                    {
                        "id": f"osm-{element['type']}-{element['id']}",
                        "name": tags["name"],
                        "type": kinds[tags["tourism"]],
                        "lat": lat,
                        "lng": lng,
                        "address": address,
                        "sourceUrl": source_url,
                        "retrievedAt": today,
                    },
                )
            )
        if tags.get("amenity") == "fuel" and distance_km <= 5:
            station = {
                "destination": venue["city"],
                "venueHint": venue["name"],
                "name": tags.get("name") or tags.get("brand") or tags.get("operator") or "Gasolinera sin nombre",
                "address": address,
                "lat": lat,
                "lng": lng,
                "sourceUrl": source_url,
                "retrievedAt": today,
            }
            if tags.get("opening_hours"):
                station["hours"] = tags["opening_hours"]
            fuel_candidates.append((distance_km, station))
        if tags.get("shop") in {"supermarket", "convenience"} and distance_km <= 3:
            market = {
                "id": f"{element['type']}-{element['id']}",
                "name": tags.get("name") or tags.get("brand") or "Tienda de alimentación",
                "kind": tags["shop"],
                "lat": lat,
                "lng": lng,
                "address": address,
                "source": "osm",
                "sourceUrl": source_url,
                "retrievedAt": today,
                "coverage": "local",
            }
            if tags.get("opening_hours"):
                market["hours"] = tags["opening_hours"]
            market_candidates.append((distance_km, market))

    added_stays = 0
    for _, candidate in sorted(lodging_candidates, key=lambda item: item[0]):
        if added_stays >= 3:
            break
        if candidate["id"] in existing_stay_ids:
            continue
        if any(
            normalize(other["name"]) == normalize(candidate["name"])
            and distance(other, candidate) < 0.4
            for other in stays["hotels"]
        ):
            continue
        stays["hotels"].append(candidate)
        existing_stay_ids.add(candidate["id"])
        added_stays += 1

    added_fuel = 0
    for _, station in sorted(fuel_candidates, key=lambda item: item[0]):
        if added_fuel >= 3:
            break
        if station["sourceUrl"] in existing_fuel_sources:
            continue
        if any(
            normalize(other["destination"]) == normalize(station["destination"])
            and normalize(other["name"]) == normalize(station["name"])
            and normalize(other["address"]) == normalize(station["address"])
            for other in fuel["stations"]
        ):
            continue
        fuel["stations"].append(station)
        existing_fuel_sources.add(station["sourceUrl"])
        added_fuel += 1

    existing_market_ids = {market["id"] for market in markets["markets"]}
    added_markets = 0
    for _, market in sorted(market_candidates, key=lambda item: item[0]):
        if added_markets >= 3:
            break
        if market["id"] in existing_market_ids:
            continue
        if any(
            normalize(other["name"]) == normalize(market["name"])
            and distance(other, market) < 0.035
            for other in markets["markets"]
        ):
            continue
        markets["markets"].append(market)
        existing_market_ids.add(market["id"])
        added_markets += 1

    if added_stays:
        stays["hotels"].sort(key=lambda item: item["id"])
        write_json(stays_path, stays)
    if added_fuel:
        fuel["stations"].sort(
            key=lambda item: (normalize(item["destination"]), normalize(item["name"]), normalize(item["address"]))
        )
        write_json(fuel_path, fuel)
    if added_markets:
        markets["markets"].sort(key=lambda item: item["id"])
        nearby = [
            market
            for market in markets["markets"]
            if distance(venue["location"], market) <= 3
        ]
        coverage = {
            "venueId": venue["id"],
            "supermarkets": sum(market.get("kind") == "supermarket" for market in nearby),
            "shops": len(nearby),
        }
        markets["coverage"] = [
            row for row in markets["coverage"] if row["venueId"] != venue["id"]
        ] + [coverage]
        markets["coverage"].sort(key=lambda item: item["venueId"])
        if source not in markets["sources"]:
            markets["sources"].append(source)
            markets["sources"].sort()
        write_json(markets_path, markets)
    return {
        "lodgings": added_stays,
        "fuel": added_fuel,
        "markets": added_markets,
        "osmSources": 1,
        "source": source,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--date", help="ISO date used only for deterministic tests/manual recovery")
    args = parser.parse_args()
    root = args.root.resolve()
    today = args.date or datetime.now(timezone.utc).date().isoformat()
    state_path = root / "src/data/real/daily-expansion-state.json"
    state = read_json(state_path)

    if not state["soriaBootstrapCompleted"]:
        result = bootstrap_soria(root, today)
        state["soriaBootstrapCompleted"] = True
        state["lastVenueId"] = SORIA_VENUE["id"]
    else:
        venues = [venue for venue in read_json(root / "src/data/venues.json") if venue["location"]]
        if not venues:
            raise RuntimeError("No hay pabellones confirmados para ampliar")
        index = state["nextVenueIndex"] % len(venues)
        venue = venues[index]
        result = expand_venue(root, venue, today)
        state["nextVenueIndex"] = (index + 1) % len(venues)
        state["lastVenueId"] = venue["id"]
    state["lastRunAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(state_path, state)
    print(json.dumps({"date": today, "venueId": state["lastVenueId"], **result}, ensure_ascii=False))


if __name__ == "__main__":
    main()
