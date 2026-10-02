"""Deterministic speech-only expansions; canonical course text stays untouched.

Ordinal spelling follows Euskaltzaindia rules 18 and 203. This deliberately
handles numerical notation, not general paraphrasing or scientific identifiers.
"""
import hashlib
import re

NORMALIZATION_VERSION = "eu-spoken-1"
MAX_INPUT_BYTES = 5000

_SMALL = (
    "zero", "bat", "bi", "hiru", "lau", "bost", "sei", "zazpi", "zortzi",
    "bederatzi", "hamar", "hamaika", "hamabi", "hamahiru", "hamalau",
    "hamabost", "hamasei", "hamazazpi", "hemezortzi", "hemeretzi",
)
_TWENTIES = {20: "hogei", 40: "berrogei", 60: "hirurogei", 80: "laurogei"}
_HUNDREDS = (
    "", "ehun", "berrehun", "hirurehun", "laurehun", "bostehun",
    "seiehun", "zazpiehun", "zortziehun", "bederatziehun",
)
_ORDINALS = (
    "zero", "lehenengo", "bigarren", "hirugarren", "laugarren", "bosgarren",
    "seigarren", "zazpigarren", "zortzigarren", "bederatzigarren",
    "hamargarren", "hamaikagarren", "hamabigarren", "hamahirugarren",
    "hamalaugarren", "hamabosgarren", "hamaseigarren", "hamazazpigarren",
    "hemezortzigarren", "hemeretzigarren",
)


def cardinal(number):
    """Return bounded course quantities; reject unsupported magnitude ambiguity."""
    if not 0 <= number <= 9999:
        raise ValueError("Spoken number is outside the supported course range")
    if number < 20:
        return _SMALL[number]
    if number < 100:
        base = number // 20 * 20
        remainder = number % 20
        return _TWENTIES[base] if not remainder else _TWENTIES[base][:-1] + "ita " + cardinal(remainder)
    if number < 1000:
        base, remainder = divmod(number, 100)
        return _HUNDREDS[base] + (" eta " + cardinal(remainder) if remainder else "")
    base, remainder = divmod(number, 1000)
    beginning = "mila" if base == 1 else cardinal(base) + " mila"
    if not remainder:
        return beginning
    tail = cardinal(remainder)
    return beginning + (" " if " eta " in tail else " eta ") + tail


def ordinal(number, compound=False):
    if not 0 <= number <= 9999:
        raise ValueError("Spoken ordinal is outside the supported course range")
    if number < 20:
        return "batgarren" if number == 1 and compound else _ORDINALS[number]
    if number < 100:
        base = number // 20 * 20
        remainder = number % 20
        return _TWENTIES[base] + "garren" if not remainder else _TWENTIES[base][:-1] + "ita " + ordinal(remainder, True)
    if number < 1000:
        base, remainder = divmod(number, 100)
        return _HUNDREDS[base] + (" eta " + ordinal(remainder, True) if remainder else "garren")
    base, remainder = divmod(number, 1000)
    beginning = "mila" if base == 1 else cardinal(base) + " mila"
    if not remainder:
        return beginning + "garren"
    tail = ordinal(remainder, True)
    return beginning + (" " if " eta " in tail else " eta ") + tail


def inflected_ordinal(number, suffix):
    word = ordinal(number)
    if number == 1 and suffix in ("etik", "era", "ean", "eko", "erako"):
        suffix = {"etik": "tik", "era": "ra", "ean": "an", "eko": "ko", "erako": "rako"}[suffix]
    return word + suffix


def spoken_number(value):
    pieces = re.split(r"[,.]", value)
    integer = cardinal(int(pieces[0]))
    # Digits after koma preserve precision and trailing zeroes without guessing.
    return integer if len(pieces) == 1 else integer + " koma " + " ".join(_SMALL[int(digit)] for digit in pieces[1])


_NUMBER = r"\d{1,4}(?:[,.]\d+)?"
_LEFT = r"(?<![\w.,\-–—])"
_RIGHT = r"(?![\w,]|\.\d)"
_DASH = r"\s*[-–—]\s*"
_TIME_NOUN = r"(?:egun|aste|hilabete)(?:etarako|etako|etatik|etara|etan|aren|en|eko|ko|erako|rako|etik|tik|era|ra|ean|an|ak|a)?"
_TIME_RANGE = re.compile(
    _LEFT + rf"(?P<first>lehenengo\s+)?(?P<a>{_NUMBER})(?P<adot>\.)?{_DASH}(?P<b>{_NUMBER})(?P<bdot>\.)?\s*(?P<noun>{_TIME_NOUN})\b(?:\s+(?P<between>artean))?"
)
_UNITS = {"cm": "zentimetro", "mm": "milimetro", "kg": "kilogramo", "g": "gramo", "ml": "mililitro", "mL": "mililitro", "L": "litro", "l": "litro"}
_UNIT = r"(?:cm|mm|kg|ml|mL|g|L|l)"


def _time_range(match):
    a, b, noun = match["a"], match["b"], match["noun"]
    stem = next(stem for stem in ("hilabete", "egun", "aste") if noun.startswith(stem))
    suffix = noun[len(stem):]
    fractional = bool(re.search(r"[,.]", a + b))
    dated = bool(match["adot"] or match["bdot"] or suffix)
    if match["first"] and not (match["adot"] or match["bdot"]):
        return f"{match['first']}{spoken_number(a)} eta {spoken_number(b)} {stem} bitartean"
    if fractional:
        return f"{spoken_number(a)} {stem}tik {spoken_number(b)} {stem}ra".replace("eguntik", "egunetik").replace("egunra", "egunera")
    if not dated:
        return f"{spoken_number(a)} eta {spoken_number(b)} {noun} artean"
    first = ordinal(int(a))
    beginning = {"aste": "astetik", "egun": "egunetik", "hilabete": "hilabetetik"}[stem]
    # Ellipsis is intentional: lehenengo astetik laugarrenera.
    result = f"{first} {beginning} {inflected_ordinal(int(b), 'era')}"
    if suffix in ("etarako", "erako", "rako"):
        result += " bitarteko " + noun
    if suffix in ("aren", "en", "eko", "ko", "etako") and not match["between"]:
        result += " arteko"
    return result


def _quantity_range(match, unit=None):
    a, b, noun = match["a"], match["b"], unit or match["noun"]
    ending = "bitartean"
    if noun in ("ordutan", "orduz"):
        noun = "ordu"
    elif noun == "orduko":
        noun, ending = "ordu", "bitarteko"
    approximate = bool(match["approx"] or match["inguru"])
    return ("gutxi gorabehera " if approximate else "") + f"{spoken_number(a)} eta {spoken_number(b)} {noun} {ending}"


# Exact scientific relationships: no blanket interpretation of arrows. These
# overrides only apply to complete, reviewed canonical strings from this catalog.
_SOURCE_OVERRIDES = {
    "Koroa erradiatua → mintz peluzidoa → mintzen fusioa": "Lehenik koroa erradiatua; ondoren mintz peluzidoa; azkenik, mintzen fusioa.",
    "Blastomeroak → morula": "Blastomeroek morula eratzen dute.",
    "Konzeptua handituta: mesodermo betea, barrunbeak agertu eta fusionatzen dira → korion barrunbea; somatopleura, esplaknopleura eta finkapen pedikulua.": "Konzeptua handituta: mesodermo betea, barrunbeak agertu eta fusionatzen dira, eta korion barrunbea eratzen dute; somatopleura, esplaknopleura eta finkapen pedikulua.",
    "Biloxka primarioak → sekundarioak → tertziarioak.": "Biloxka primarioak, ondoren sekundarioak eta azkenik tertziarioak.",
    "Mozketa: korion-plaka → enborrezko biloxkak (adarkatuta) → kanpoko zorro zitotrofoblastikoa → dezidua basala, biloxka arteko espazioan amaren odola zirkulatzen.": "Mozketan, ordena hau ikusten da: korion-plaka, enborrezko biloxkak, adarkatuta, kanpoko zorro zitotrofoblastikoa eta dezidua basala; biloxka arteko espazioan amaren odola zirkulatzen.",
    "Zirkuitu jarraitu bakarra osatuta dago: enbrioia ↔ zilbor-hodiak ↔ korion-plaka ↔ biloxka tertziarioetako kapilarrak.": "Zirkuitu jarraitu bakarra osatuta dago enbrioiaren, zilbor-hodien, korion-plakaren eta biloxka tertziarioetako kapilarren artean.",
    "Enbrioia ↔ zilborra ↔ biloxka.": "Enbrioiaren, zilborraren eta biloxkaren arteko joan-etorria.",
    "Ebaki zeharkako bat, notokordaren gainean: plaka neurala → ildo neurala → tolesdura neuralak → hodi neurala, azaleko ektodermoak estalita.": "Ebaki zeharkako bat, notokordaren gainean: lehenik plaka neurala, ondoren ildo neurala, gero tolesdura neuralak eta azkenik hodi neurala, azaleko ektodermoak estalita.",
    "Erdia → herena → laurdena": "Erdia, ondoren herena, eta azkenik laurdena",
    "Fetuaren odola: enbrioi barruko odol-hodiak → finkapen pedikuluko zilbor-hodiak → korion plakako odol-hodiak → biloxka tertziarioetako odol-hodiak.": "Fetuaren odolaren bidea: enbrioi barruko odol-hodietatik, finkapen pedikuluko zilbor-hodietara; handik korion plakako odol-hodietara, eta biloxka tertziarioetako odol-hodietara.",
    "Fetuaren odola: enbrioi barruko odol-hodiak → zilbor-hesteko (finkapen pedikuluko) odol-hodiak → korion plakako odol-hodiak → biloxka tertziarioetako odol-hodiak.": "Fetuaren odolaren bidea: enbrioi barruko odol-hodietatik, zilbor-hesteko, hau da, finkapen pedikuluko odol-hodietara; handik korion plakako odol-hodietara, eta biloxka tertziarioetako odol-hodietara.",
    "Karena muga: 4 → 2. Biloxka askearen zeharkako mozketa 3. hilabetean (C, lau geruza) eta 4. hilabetetik aurrera (D, bi geruza).": "Karena muga: lau geruzatik bi geruzara. Biloxka askearen zeharkako mozketa 3. hilabetean (C, lau geruza) eta 4. hilabetetik aurrera (D, bi geruza).",
    "Amnios barrunbea hazten da (likido gehiago) eta korion barrunbea okupatzen du: amnios pareta korion leunarekin fusionatzen da → mintz amniokorionikoa, erditzean apurtzen dena.": "Amnios barrunbea hazten da (likido gehiago) eta korion barrunbea okupatzen du: amnios pareta korion leunarekin fusionatzen da eta mintz amniokorionikoa eratzen da, erditzean apurtzen dena.",
    "Apunteetako irudia (A → B): dezidua basala, kapsularra eta paretakoa; korion hostotsua eta leuna; amnios barrunbea hazten da eta umetoki barrunbea ixten da.": "Apunteetako irudia, a iruditik be irudira: dezidua basala, kapsularra eta paretakoa; korion hostotsua eta leuna; amnios barrunbea hazten da eta umetoki barrunbea ixten da.",
    "Korion barrunbea eta gero amnios barrunbea handitzen dira: amnios paretak eraztuneko egiturak inguratzen ditu → hasierako zilbor-hestea.": "Korion barrunbea eta gero amnios barrunbea handitzen dira: amnios paretak eraztuneko egiturak inguratzen ditu eta hasierako zilbor-hestea eratzen da.",
    "Apunteetako irudia (A → B): enbrioia amnios barrunbean; hasierako zilbor eraztuna, finkapen pedikulua, hodi onfalomesenterikoa eta bitelo-zakua; amniosak inguratzen ditu.": "Apunteetako irudia, a iruditik be irudira: enbrioia amnios barrunbean; hasierako zilbor eraztuna, finkapen pedikulua, hodi onfalomesenterikoa eta bitelo-zakua; amniosak inguratzen ditu.",
}
_OVERRIDES = {hashlib.sha256(source.encode("utf-8")).hexdigest(): spoken for source, spoken in _SOURCE_OVERRIDES.items()}


def normalize_spoken_text(text):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Canonical speech text must be a nonempty string")
    result = _OVERRIDES.get(hashlib.sha256(text.encode("utf-8")).hexdigest(), text)
    # Expand markers before quantities become words; otherwise ~500 g would
    # survive as a literal tilde once 500 has already become bostehun.
    result = re.sub(r"[~≈]\s*(?=\d)", "gutxi gorabehera ", result)
    # Explicit, individually approved identifier pronunciations. These name
    # the same formulas/levels; they never invent scientific definitions.
    result = re.sub(r"\bC4\s*[-–—]\s*C8\b", "ze lautik ze zortzira", result)
    for identifier, pronunciation in (("CO2", "ze o bi"), ("O2", "o bi"), ("CO", "ze o"), ("DNA", "de ene a")):
        result = re.sub(r"\b" + identifier + r"\b", pronunciation, result)
    result = re.sub(r"\bEgun\s+(\d{1,3})ko\b", lambda m: ordinal(int(m[1])) + " eguneko", result)
    result = _TIME_RANGE.sub(_time_range, result)
    # Dotted ranges with an elided noun: 37.–38.ean, (6.–9.).
    result = re.sub(_LEFT + r"(\d{1,3})\.\s*[-–—]\s*(\d{1,3})\.(ean|a|ak|aren|en|etik|era|eko)?(?!\w)",
                    lambda m: inflected_ordinal(int(m[1]), "etik") + " " + inflected_ordinal(int(m[2]), "era") + (" arteko" if m[3] in ("aren", "en", "eko") else ""), result)
    # Ordinal suffixes are kept, including 5.a and 30.ean.
    result = re.sub(_LEFT + r"(\d{1,3})\.(ean|a|ak|aren|en|etik|era|eko|erako)(?!\w)",
                    lambda m: inflected_ordinal(int(m[1]), m[2]), result)
    result = re.sub(_LEFT + r"(\d{1,3})\.(?!\d)(?=\s*(?:[,;)]|eta\b|egun\w*\b|aste\w*\b|hilabete\w*\b|gaia\b))",
                    lambda m: ordinal(int(m[1])), result, flags=re.IGNORECASE)
    result = re.sub(r"(?<!\w)(II|III|IV|I)\.(?!\w)", lambda m: ordinal({"I": 1, "II": 2, "III": 3, "IV": 4}[m[1]]), result)
    # Percentages repeat ehuneko at both endpoints; this is not subtraction.
    result = re.sub(rf"%\s*({_NUMBER}){_DASH}({_NUMBER})", lambda m: f"ehuneko {spoken_number(m[1])} eta ehuneko {spoken_number(m[2])} bitartean", result)
    result = re.sub(rf"%\s*({_NUMBER})", lambda m: "ehuneko " + spoken_number(m[1]), result)
    result = re.sub(_LEFT + rf"({_NUMBER})\s*%", lambda m: "ehuneko " + spoken_number(m[1]), result)
    # Physical measurements remain cardinal, including fractional day ranges.
    range_prefix = _LEFT + rf"(?P<approx>gutxi gorabehera\s+)?(?P<a>{_NUMBER}){_DASH}(?P<b>{_NUMBER})\s*"
    range_suffix = r"\b(?P<inguru>\s+inguru)?"
    result = re.sub(range_prefix + rf"(?P<unit>{_UNIT})" + range_suffix,
                    lambda m: _quantity_range(m, _UNITS[m["unit"]]), result)
    result = re.sub(range_prefix + r"(?P<noun>ordutan|orduko|orduz|ordu|aldiz|zelula|blastomero|bikote|kokzigeo|folikulu|somita)" + range_suffix,
                    _quantity_range, result)
    result = re.sub(_LEFT + rf"({_NUMBER})\s*({_UNIT})\b",
                    lambda m: (_UNITS[m[2]] + " bat") if m[1] == "1" else spoken_number(m[1]) + " " + _UNITS[m[2]], result)
    # Remaining quantity ranges have no temporal noun: 42–44 bikote.
    result = re.sub(_LEFT + rf"({_NUMBER}){_DASH}({_NUMBER})" + _RIGHT + r"(?P<between>\s+artean)?",
                    lambda m: spoken_number(m[1]) + " eta " + spoken_number(m[2]) + (" artean" if m["between"] else " arteko"), result)
    result = re.sub(_LEFT + rf"({_NUMBER})" + _RIGHT, lambda m: spoken_number(m[1]), result)
    result = re.sub(r"\bbikote/egun\b", "bikote eguneko", result)
    # Other scientific tokens such as FGF8, HLA-G, S1 and 3D are untouched.
    return result


def validate_spoken_input(text):
    size = len(text.encode("utf-8"))
    if not text.strip() or size > MAX_INPUT_BYTES:
        raise ValueError("Spoken input exceeds the 5000-byte UTF-8 limit or is empty; no request was sent")
    return size
