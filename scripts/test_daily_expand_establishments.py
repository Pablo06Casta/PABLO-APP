import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("daily-expand-establishments.py")
SPEC = importlib.util.spec_from_file_location("daily_expand", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DailyExpansionTest(unittest.TestCase):
    def test_first_run_is_exact_and_idempotent(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            data = root / "src/data/real"
            data.mkdir(parents=True)
            (root / "src/data/venues.json").write_text("[]")
            (data / "osm-stays.json").write_text(json.dumps({"retrievedAt": "2026-10-19", "hotels": []}))
            (data / "fuel-references.json").write_text(json.dumps({"providedAt": "2026-10-19", "scope": "", "priceComparator": "https://example.com", "stations": []}))
            (data / "venue-markets.json").write_text(json.dumps({"retrievedAt": "2026-10-19", "sources": [], "coverage": [], "markets": []}))

            first = MODULE.bootstrap_soria(root, "2026-10-20")
            second = MODULE.bootstrap_soria(root, "2026-10-20")

            self.assertEqual(first, {"venues": 1, "lodgings": 10, "fuel": 5, "markets": 5})
            self.assertEqual(second, {"venues": 0, "lodgings": 0, "fuel": 0, "markets": 0})
            self.assertEqual(len(json.loads((root / "src/data/venues.json").read_text())), 1)
            self.assertEqual(len(json.loads((data / "osm-stays.json").read_text())["hotels"]), 10)
            self.assertEqual(len(json.loads((data / "fuel-references.json").read_text())["stations"]), 5)
            self.assertEqual(len(json.loads((data / "venue-markets.json").read_text())["markets"]), 5)


if __name__ == "__main__":
    unittest.main()
