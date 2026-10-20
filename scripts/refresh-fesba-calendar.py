#!/usr/bin/env python3
"""Actualiza una selección fechada del calendario público de badminton.es.

Solo recoge datos básicos de competiciones en España. La página no ofrece
un pabellón para la mayoría de torneos: la ciudad no prueba la sede exacta.
Sin conexión o sin datos válidos, mantiene la última copia publicada.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/data/real/fesba-calendar.json"
BASE = "https://www.badminton.es"
CALENDAR = BASE + "/calendar/192/Calendario-FESBA"
GROUPS = {
    "Ctos. España", "ESP_Absoluto", "ESP_Jóvenes", "ESP_Sénior",
    "Junior", "Sub-15", "Sub-17", "TTR", "Parabádminton", "LNC",
}
UNKNOWN_CITIES = {"por determinar", "pd", "sedes clubes", "por decidir", ""}
ROW = re.compile(r'<tr class="[^"]*\beg\d+[^"\n]*"[^>]*>(.*?)</tr>', re.S)
CELL = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
LINK = re.compile(r'href="([^"]*/calendarevent/(\d+)/[^"]+)"', re.I)
TAG = re.compile(r"<[^>]*>")
START = re.compile(r'<time\b[^>]*itemprop="startDate"[^>]*datetime="(\d{4}-\d{2}-\d{2})"', re.I)
END = re.compile(r'<time\b[^>]*itemprop="endDate"[^>]*datetime="(\d{4}-\d{2}-\d{2})"', re.I)


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in value if not unicodedata.combining(c))).strip()


def text(value: str) -> str:
    return " ".join(html.unescape(TAG.sub(" ", value)).split())


def destination(city: str, destinations: set[str]) -> str | None:
    aliases = {
        "vitoria gasteiz": "Vitoria-Gasteiz",
        "estella lizarra": "Estella-Lizarra",
        "estella": "Estella-Lizarra",
        "san jose de la rinconada": "La Rinconada",
        "eivissa": "Ibiza",
        "tudela de duero valladolid": "Tudela de Duero",
    }
    key = norm(city)
    choice = aliases.get(key, city)
    return choice if norm(choice) in destinations else None


def parse_calendar(body: str, year: int, today: dt.date, destinations: set[str]) -> list[dict]:
    events = []
    for match in ROW.finditer(body):
        cells = CELL.findall(match.group(1))
        link = LINK.search(match.group(1))
        if len(cells) < 7 or not link:
            continue
        fields = [text(cell) for cell in cells]
        try:
            start = dt.datetime.strptime(fields[1], "%d/%m/%Y").date()
        except ValueError:
            continue
        if start.year != year or start < today or fields[6] != "España":
            continue
        if fields[2] not in GROUPS or norm(fields[5]) in UNKNOWN_CITIES:
            continue
        url = urljoin(CALENDAR, link.group(1))
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc != "www.badminton.es" or not parsed.path.startswith("/calendarevent/"):
            continue
        events.append({
            "id": link.group(2),
            "name": fields[4],
            "startDate": start.isoformat(),
            "city": fields[5],
            "destination": destination(fields[5], destinations),
            "group": fields[2],
            "category": fields[3],
            "sourceUrl": url,
        })
    return events


def fetch(url: str) -> str:
    response = urlopen(Request(url, headers={"User-Agent": "CERCA-badminton-calendar/1.0 (personal project; https://github.com/Pablo06Casta/PABLO-APP)", "Accept": "text/html"}), timeout=18)
    if response.status != 200:
        raise ValueError(f"HTTP {response.status}")
    body = response.read(1_500_001)
    if len(body) > 1_500_000:
        raise ValueError("Respuesta demasiado grande")
    return body.decode("utf-8", "replace")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--today", help="Fecha de consulta AAAA-MM-DD; omite para usar Europe/Madrid")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    today = dt.date.fromisoformat(args.today) if args.today else dt.datetime.now(ZoneInfo("Europe/Madrid")).date()
    destinations = {norm(item["city"]) for item in json.loads((ROOT / "src/data/venues.json").read_text())}
    old = json.loads(args.output.read_text()) if args.output.exists() else {"events": []}
    events = []
    updated_years = []
    for year in (today.year, today.year + 1):
        url = f"{CALENDAR}?year={year}"
        try:
            body = fetch(url)
            if "Calendario FESBA" not in text(body[:100_000]) and "/calendarevent/" not in body:
                raise ValueError("No se encontró la tabla del calendario")
            selected = parse_calendar(body, year, today, destinations)
            # Un año futuro aún puede no tener ciudades confirmadas. Eso no debe
            # borrar una copia anterior ante una página de error disfrazada.
            if not ROW.search(body):
                raise ValueError("No se encontraron filas de eventos")
            events.extend(selected)
            updated_years.append(year)
            print(f"FESBA {year}: {len(selected)} competiciones con ciudad en España")
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            print(f"FESBA {year}: sin actualización ({exc}); se conserva la copia", file=sys.stderr)
            events.extend(item for item in old.get("events", []) if item["startDate"].startswith(str(year)) and item["startDate"] >= today.isoformat())
    # Solo se consultan detalles de destinos de CERCA, que permiten planear un
    # viaje. El calendario de 2027 contiene muchas sedes por determinar.
    for event in events:
        if not event["destination"] or int(event["startDate"][:4]) not in updated_years:
            continue
        try:
            detail = fetch(event["sourceUrl"])
            start, end = START.search(detail), END.search(detail)
            if start and start.group(1) == event["startDate"]:
                if end:
                    end_date = dt.date.fromisoformat(end.group(1))
                    duration = (end_date - dt.date.fromisoformat(start.group(1))).days
                    if 0 <= duration <= 14:
                        event["endDate"] = end_date.isoformat()
                elif "<strong>Fecha:</strong>" in detail:
                    event["endDate"] = event["startDate"]
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            print(f"Detalle {event['id']}: fecha final sin verificar ({exc})", file=sys.stderr)
    unique = {event["id"]: event for event in events}
    result = sorted(unique.values(), key=lambda event: (event["startDate"], event["city"], event["name"]))
    if not updated_years:
        print("El calendario local no cambió", file=sys.stderr)
        return 0 if args.output.exists() else 1
    snapshot = {
        "source": CALENDAR,
        "retrievedAt": today.isoformat(),
        "updatedYears": updated_years,
        "scope": "Competiciones con ciudad publicada en España; cursos y actividades excluidos. La ciudad no confirma el pabellón.",
        "events": result,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    print(f"Total: {len(result)} eventos; copia {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
