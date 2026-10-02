"""Meaningful pronunciation contracts; no credentials or provider calls."""
import hashlib
import json
from pathlib import Path
import unittest

from normalize_basque import (
    _OVERRIDES, cardinal, normalize_spoken_text, ordinal, validate_spoken_input,
)


class SpokenBasqueContract(unittest.TestCase):
    def test_user_requested_range_and_contextual_dates(self):
        examples = {
            "1-4 astera": "lehenengo astetik laugarrenera",
            "3.–8. astea": "hirugarren astetik zortzigarrenera",
            "9.–12. asteetako": "bederatzigarren astetik hamabigarrenera arteko",
            "15.–16. egunetan": "hamabosgarren egunetik hamaseigarrenera",
            "0.–1. egunak": "zero egunetik lehenengora",
            "1.–2.ean": "lehenengotik bigarrenera",
            "19–20. egunetarako": "hemeretzigarren egunetik hogeigarrenera bitarteko egunetarako",
            "Egun 28ko enbrioia": "hogeita zortzigarren eguneko enbrioia",
            "10. astean": "hamargarren astean",
            "30.ean": "hogeita hamargarrenean",
            "37.–38.ean": "hogeita hamazazpigarrenetik hogeita hemezortzigarrenera",
            "5.a": "bosgarrena",
            "4. eta 5. egunen artean": "laugarren eta bosgarren egunen artean",
            "9., 12., 20., 28. eta 38. asteetako": "bederatzigarren, hamabigarren, hogeigarren, hogeita zortzigarren eta hogeita hemezortzigarren asteetako",
            "hilabeteetan (6.–9.)": "hilabeteetan (seigarrenetik bederatzigarrenera)",
        }
        for source, spoken in examples.items():
            with self.subTest(source=source):
                self.assertEqual(normalize_spoken_text(source), spoken)

    def test_irregular_and_compound_ordinals(self):
        examples = {1: "lehenengo", 5: "bosgarren", 12: "hamabigarren", 20: "hogeigarren", 21: "hogeita batgarren", 22: "hogeita bigarren", 25: "hogeita bosgarren", 30: "hogeita hamargarren", 32: "hogeita hamabigarren", 40: "berrogeigarren"}
        for number, expected in examples.items():
            with self.subTest(number=number):
                self.assertEqual(ordinal(number), expected)
        self.assertEqual(cardinal(237), "berrehun eta hogeita hamazazpi")
        self.assertEqual(cardinal(1000), "mila")
        for number, expected in {1001: "mila eta bat", 1100: "mila eta ehun", 1201: "mila berrehun eta bat", 2025: "bi mila eta hogeita bost", 1107: "mila ehun eta zazpi"}.items():
            self.assertEqual(cardinal(number), expected)
        self.assertEqual(ordinal(1001), "mila eta batgarren")

    def test_quantities_decimals_percentages_and_units_keep_interval_meaning(self):
        examples = {
            "4,5–5. egunak": "lau koma bost egunetik bost egunera",
            "5,5–6. egunak": "bost koma bost egunetik sei egunera",
            "3–3,4 kg": "hiru eta hiru koma lau kilogramo bitartean",
            "200–500 ml": "berrehun eta bostehun mililitro bitartean",
            "800–1000 ml": "zortziehun eta mila mililitro bitartean",
            "1 L inguru": "litro bat inguru",
            "0,50 cm": "zero koma bost zero zentimetro",
            "0,05 cm": "zero koma zero bost zentimetro",
            "46.": "berrogeita sei.",
            "%20–30": "ehuneko hogei eta ehuneko hogeita hamar bitartean",
            "%90": "ehuneko laurogeita hamar",
            "42-44 bikote": "berrogeita bi eta berrogeita lau bikote bitartean",
            "8-10 kokzigeo": "zortzi eta hamar kokzigeo bitartean",
            "~3 bikote/egun": "gutxi gorabehera hiru bikote eguneko",
            "4-5 egun": "lau eta bost egun artean",
            "lehenengo 6–8 asteetan": "lehenengo sei eta zortzi aste bitartean",
            "~500 g": "gutxi gorabehera bostehun gramo",
            "~36 cm": "gutxi gorabehera hogeita hamasei zentimetro",
            "~1 L": "gutxi gorabehera litro bat",
            "≈32 zelula": "gutxi gorabehera hogeita hamabi zelula",
            "16–20 artean": "hamasei eta hogei artean",
            "3–4 aldiz": "hiru eta lau aldiz bitartean",
            "40–50 cm inguru": "gutxi gorabehera berrogei eta berrogeita hamar zentimetro bitartean",
            "~40–50 cm inguru": "gutxi gorabehera berrogei eta berrogeita hamar zentimetro bitartean",
            "12–24 ordu": "hamabi eta hogeita lau ordu bitartean",
            "12–24 ordutan": "hamabi eta hogeita lau ordu bitartean",
            "12–24 orduko aldia": "hamabi eta hogeita lau ordu bitarteko aldia",
        }
        for source, spoken in examples.items():
            with self.subTest(source=source):
                self.assertEqual(normalize_spoken_text(source), spoken)

    def test_scientific_identifiers_and_unknown_relationships_are_preserved(self):
        source = "FGF8, HLA-G, S1, Hox-10 eta 3D; A/B; X → Y; a ↔ b"
        self.assertEqual(normalize_spoken_text(source), source)
        self.assertEqual(normalize_spoken_text("I. eta II. zatiketak"), "lehenengo eta bigarren zatiketak")
        self.assertEqual(normalize_spoken_text("DNA, CO2, O2 eta C4–C8"), "de ene a, ze o bi, o bi eta ze lautik ze zortzira")
        self.assertEqual(normalize_spoken_text("CO zein CO2"), "ze o zein ze o bi")
        self.assertEqual(normalize_spoken_text("ADNA eta CO2X"), "ADNA eta CO2X")

    def test_exact_reviewed_overrides_cover_every_arrow_in_current_catalog(self):
        catalog_path = Path(__file__).resolve().parents[2] / ".narration-tools/catalog.json"
        if not catalog_path.exists():
            self.skipTest("Local exported catalog not available")
        entries = json.loads(catalog_path.read_text(encoding="utf8"))["entries"]
        arrows = [entry for entry in entries if "→" in entry["text"] or "↔" in entry["text"]]
        self.assertEqual(len(arrows), 16)
        self.assertEqual(len(_OVERRIDES), 16)
        for entry in arrows:
            self.assertIn(entry["hash"], _OVERRIDES)
            spoken = normalize_spoken_text(entry["text"])
            self.assertNotIn("→", spoken)
            self.assertNotIn("↔", spoken)
            self.assertEqual(hashlib.sha256(entry["text"].encode()).hexdigest(), entry["hash"])
        barrier = next(entry for entry in arrows if entry["text"].startswith("Karena muga:"))
        self.assertIn("lau geruzatik bi geruzara", normalize_spoken_text(barrier["text"]))
        self.assertIn("hirugarren hilabetean", normalize_spoken_text(barrier["text"]))

    def test_utf8_limit_is_on_actual_input_bytes(self):
        self.assertEqual(validate_spoken_input("x" * 5000), 5000)
        with self.assertRaisesRegex(ValueError, "5000-byte"):
            validate_spoken_input("ü" * 2501)
        with self.assertRaises(ValueError):
            normalize_spoken_text(" ")


if __name__ == "__main__":
    unittest.main()
