#!/usr/bin/env python3
"""Revisa diariamente el modelo propio de estimaciones de CERCA."""

from __future__ import annotations

import argparse
from datetime import datetime
import json
from pathlib import Path
from zoneinfo import ZoneInfo

DEFAULT_ROOT = Path(__file__).resolve().parent.parent
FORBIDDEN_FIELDS = {
    "observedAt",
    "observedNightly",
    "priceReferenceAt",
    "priceReferenceSource",
    "referenceNightly",
}


def find_forbidden_fields(value, path="$"):
    found = []
    if isinstance(value, dict):
        for key, item in value.items():
            child = f"{path}.{key}"
            if key in FORBIDDEN_FIELDS:
                found.append(child)
            found.extend(find_forbidden_fields(item, child))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found.extend(find_forbidden_fields(item, f"{path}[{index}]"))
    return found


def refresh(root: Path, review_date: str) -> dict:
    data_root = root / "src/data/real"
    removed_prices = data_root / "hotel-price-references.json"
    if removed_prices.exists():
        raise ValueError("No se puede reactivar hotel-price-references.json")

    violations = []
    checked_files = 0
    for path in sorted(data_root.glob("*.json")):
        value = json.loads(path.read_text(encoding="utf-8"))
        checked_files += 1
        violations.extend(
            f"{path.relative_to(root)}:{field}"
            for field in find_forbidden_fields(value)
        )
    if violations:
        raise ValueError(
            "Se encontraron referencias de precios comerciales retiradas:\n"
            + "\n".join(violations)
        )

    model_path = data_root / "price-model.json"
    model = json.loads(model_path.read_text(encoding="utf-8"))
    if model.get("version") != 1:
        raise ValueError("Versión desconocida del modelo de precios")
    expected_categories = {"Habitación", "Hotel", "Apartamento", "Casa rural", "Casa"}
    if set(model.get("bases", {})) != expected_categories:
        raise ValueError("El modelo debe definir todas las categorías de alojamiento")
    if any(not isinstance(value, (int, float)) or value <= 0 for value in model["bases"].values()):
        raise ValueError("Las bases del modelo deben ser importes positivos")
    if model.get("currency") != "EUR":
        raise ValueError("El modelo público debe expresarse en EUR")
    if "no contiene tarifas observadas" not in model.get("source", ""):
        raise ValueError("El modelo debe declarar que no contiene tarifas observadas")

    model["reviewedAt"] = review_date
    model_path.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return {
        "reviewedAt": review_date,
        "checkedFiles": checked_files,
        "commercialPriceFields": 0,
        "bases": model["bases"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--date", help="Fecha ISO para pruebas o recuperación manual")
    args = parser.parse_args()
    review_date = args.date or datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
    datetime.strptime(review_date, "%Y-%m-%d")
    result = refresh(args.root.resolve(), review_date)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
