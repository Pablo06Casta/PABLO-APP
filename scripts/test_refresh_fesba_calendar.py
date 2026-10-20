"""El importador conserva solo competiciones, fechas y ciudades publicadas."""
import datetime as dt
import runpy
import unittest
from pathlib import Path

module = runpy.run_path(str(Path(__file__).with_name("refresh-fesba-calendar.py")))
parse = module["parse_calendar"]


def row(group="TTR", city="Granollers", country="España", link="../../calendarevent/42/Torneo"):
    return f'''<tr class="tc_m11 eg276"><td>45</td><td>06/11/2026</td><td>{group}</td><td>Sub-17</td><td><a href="{link}">Torneo de prueba</a></td><td>{city}</td><td>{country}</td></tr>'''


class CalendarImportTest(unittest.TestCase):
    def test_accepts_factual_tournaments_and_skips_unconfirmed_locations(self):
        markup = row() + row(city="Por Determinar") + row(group="Entrenadores") + row(country="Francia")
        events = parse(markup, 2026, dt.date(2026, 10, 19), {"granollers"})
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["destination"], "Granollers")
        self.assertEqual(events[0]["startDate"], "2026-11-06")
        self.assertEqual(events[0]["sourceUrl"], "https://www.badminton.es/calendarevent/42/Torneo")

    def test_rejects_old_or_wrong_year_and_foreign_links(self):
        markup = row().replace("06/11/2026", "06/11/2025") + row(link="https://evil.example/calendarevent/99/False")
        self.assertEqual(parse(markup, 2026, dt.date(2026, 10, 19), {"granollers"}), [])

    def test_maps_tudela_calendar_label_to_the_new_destination(self):
        events = parse(
            row(city="Tudela de Duero (Valladolid)"),
            2026,
            dt.date(2026, 10, 19),
            {"tudela de duero"},
        )
        self.assertEqual(events[0]["destination"], "Tudela de Duero")


if __name__ == "__main__":
    unittest.main()
