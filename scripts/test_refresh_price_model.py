import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("refresh-price-model.py")
SPEC = importlib.util.spec_from_file_location("refresh_price_model", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PriceModelRefreshTest(unittest.TestCase):
    def create_root(self, folder):
        root = Path(folder)
        data = root / "src/data/real"
        data.mkdir(parents=True)
        (data / "price-model.json").write_text(
            json.dumps(
                {
                    "version": 1,
                    "reviewedAt": "2026-10-20",
                    "currency": "EUR",
                    "bases": {
                        "Habitación": 50,
                        "Hotel": 75,
                        "Apartamento": 100,
                        "Casa rural": 75,
                        "Casa": 75,
                    },
                    "cityFactors": [],
                    "summer": {"months": [6, 7, 8], "factor": 1.2},
                    "range": {"low": 0.7, "high": 1.4},
                    "source": "Modelo propio; no contiene tarifas observadas.",
                }
            ),
            encoding="utf-8",
        )
        (data / "stays.json").write_text(json.dumps({"hotels": []}), encoding="utf-8")
        return root, data

    def test_updates_review_date_without_commercial_prices(self):
        with tempfile.TemporaryDirectory() as folder:
            root, data = self.create_root(folder)
            result = MODULE.refresh(root, "2026-10-21")
            model = json.loads((data / "price-model.json").read_text(encoding="utf-8"))
            self.assertEqual(model["reviewedAt"], "2026-10-21")
            self.assertEqual(result["commercialPriceFields"], 0)

    def test_rejects_removed_price_fields(self):
        with tempfile.TemporaryDirectory() as folder:
            root, data = self.create_root(folder)
            (data / "stays.json").write_text(
                json.dumps({"hotels": [{"referenceNightly": 99}]}),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "precios comerciales"):
                MODULE.refresh(root, "2026-10-21")


if __name__ == "__main__":
    unittest.main()
