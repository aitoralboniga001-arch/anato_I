"""Extract the ORIGINAL PDFs. No spelling, punctuation or content corrections.

Requires PyMuPDF. --check is read-only and compares both the PDF text and the
committed TypeScript, including emphasis and ids. Only audited furniture goes.
"""
import argparse
import collections
import difflib
import hashlib
import json
import pathlib
import re
import sys

import fitz

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'content' / 'notes-text'
FILES = [
    '1. Enbriologia_Garapenaren lehenengo astea (zuzenduta).docx.pdf',
    '2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).pdf',
    '3. Enbriologia_Garapenaren hirugarren astea .pdf',
    '4. Enbriologia_Garapenaren laugarren astea (ZUZENDUTA).pdf',
    '5. GAIA_Enbrioi eta fetuaren ezaugarri nagusiak (zuzenduta).pdf',
    '6. Enbriologia 3. hilabetetik jaiotzara arte_ fetua eta karena (ZUZENDUTA).docx.pdf',
    '7.GAIA_Gorputzaren barrunbeak (ZUZENDUTA).pdf',
    '8. GAIA_ HEZUR SISTEMA (zuzendu gabe).docx.pdf',
    # Topic 9 came as a DOCX only: exported to PDF with Word (same name + .pdf), text unchanged.
    '9.GAIA _MUSKULU EDO GIHAR SISTEMA .docx.pdf',
    '10. GAIA_ ZIRKULAZIO APARATUA (ZUZENDUTA).pdf',
    '11. GAIA. ZIRKULAZIO-SISTEMA (II) (zuzenduta).pdf',
    '12. GAIA_ARTERIA SISTEMA (zirkulazio-sistema III) (zuzendu gabe) (1).pdf',
    '13. GAIA_ZAIN SISTEMA (zirkulazio-sistema IV) (Zuzenduta).pdf',
    '14.GAIA_DIGESTIO APARATUA 1.ATALA (Zuzenduta).pdf',
]


# Week 12's figure captions are set in body type beside the text: they are recognised by their words.
CAPTIONS_12 = ('Embrioiaren zirkulazio sistema', 'Arku sistema hasierako garapenean', 'Garapenaren 27.eguna', 'Garapenaren 29. eguna', 'Arkuetatik eratutako arteria', 'ezberdinak', 'Nerbioak aorta arkua', 'arteria subklabioa inguratzen', 'Aortaren atalak eta bertatik', 'ateratako arteriak', 'Aorta dortsalaren fusioa', 'Aurreko errai adarrak', 'Alboko errai adarrak', 'Atze alboko arteriak (segmentuarteko', 'Goiko gorputz adarren arterien garapena')


def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


def block_text(block):
    return ''.join(p['text'] for s in block['sentences'] for p in s['parts'])


def furniture(line, page):
    text = norm(''.join(s['text'] for s in line['spans']))
    y = line['bbox'][1]
    return (y < 65 and bool(re.search(r'GIZA ANATOMIA|ANATOMIA I|MEDIKUNTZA 1|RAFAEL SARRIA|31 TALDEA', text, re.I)) or (y < 90 and bool(re.fullmatch(r'31\. TALDEA \d{4}/\d\d/\d\d', text)))) or (y > page.rect.height - 65 and bool(re.fullmatch(r'\d+', text)))


def compact(parts):
    out = []
    for p in parts:
        if not p['text']:
            continue
        if out and (out[-1].get('b'), out[-1].get('i')) == (p.get('b'), p.get('i')):
            out[-1]['text'] += p['text']
        else:
            out.append(dict(p))
    return out


def split_sentences(parts, week=0):
    text = ''.join(p['text'] for p in parts)
    ends = []
    # Decimal/section ordinals, initials and abbreviations are not sentence ends.
    for m in re.finditer(r'[.!?]+(?:[”»\")\]]*)(?:\s+|$)', text):
        prefix = text[:m.start()]
        token = re.search(r'[\w,]+$', prefix)
        word = token.group() if token else ''
        if word.isdigit() or re.fullmatch(r'\d+,\d+', word) or len(word) == 1 or word.lower() in {'adib', 'etab', 'etc', 'dr', 'irud', 'vs'} or (week == 12 and (word == 'ezk' or re.fullmatch(r'[IVX]+', word))):
            continue
        ends.append(m.end())
    if not ends or ends[-1] != len(text):
        ends.append(len(text))
    result, start = [], 0
    for end in ends:
        sliced, pos = [], 0
        for p in parts:
            lo, hi = max(start - pos, 0), min(end - pos, len(p['text']))
            if hi > lo:
                sliced.append({**p, 'text': p['text'][lo:hi]})
            pos += len(p['text'])
        if sliced:
            result.append(compact(sliced))
        start = end
    return result


def extract(path, week):
    doc = fitz.open(path)
    lines, removed = [], []
    # Preserve PDF reading order, also used by get_text('text'); don't sort columns. Week 12 sets its
    # two-column summary tables as text boxes stored after the prose that follows them: its blocks are
    # read top to bottom (both extractions sorted the same way), so each table stays in its own section.
    order = week == 12
    # Week 13 (a Google Docs export) wraps every word in zero-width spaces, and a justified line keeps only
    # the two of them (no space) between words: two in a row are the word gap, a single one is dropped,
    # or no number, heading or page footer would be recognised.
    zw = (lambda s: s.replace('​​', ' ').replace('​', '')) if week == 13 else (lambda s: s)
    for pn, page in enumerate(doc):
        for b in page.get_text('dict', sort=order)['blocks']:
            if b['type'] != 0:
                continue
            for line in b['lines']:
                spans = line['spans']
                for i, span in enumerate(spans):
                    # The word gap can straddle two spans (a bold word ends one).
                    if week == 13 and span['text'].endswith('​') and i + 1 < len(spans) and spans[i + 1]['text'].startswith('​') and not span['text'].endswith('​​'):
                        span['text'] = span['text'][:-1] + ' '
                        spans[i + 1]['text'] = spans[i + 1]['text'][1:]
                    span['text'] = zw(span['text'])
                text = norm(''.join(s['text'] for s in line['spans']))
                if not text:
                    continue
                if furniture(line, page):
                    removed.append({'page': pn + 1, 'text': text})
                    continue
                parts = []
                for span in line['spans']:
                    p = {'text': re.sub(r'\s+', ' ', span['text'])}
                    if span['flags'] & 16:
                        p['b'] = True
                    if span['flags'] & 2:
                        p['i'] = True
                    parts.append(p)
                joined = ''.join(p['text'] for p in parts)
                # Trim edges without changing any non-whitespace character.
                left, right = len(joined) - len(joined.lstrip()), len(joined.rstrip())
                trimmed, offset = [], 0
                for p in parts:
                    lo, hi = max(0, left - offset), min(len(p['text']), right - offset)
                    if hi > lo:
                        trimmed.append({**p, 'text': p['text'][lo:hi]})
                    offset += len(p['text'])
                lines.append({'parts': compact(trimmed), 'text': text, 'page': pn, 'box': line['bbox'], 'size': max(s['size'] for s in line['spans'] if s['text'].strip()), 'bold': sum(len(s['text'].strip()) for s in line['spans'] if s['flags'] & 16) / max(1, len(text)), 'italic': any(s['flags'] & 2 for s in line['spans']), 'all_italic': all(s['flags'] & 2 for s in line['spans'] if s['text'].strip())})
    # Independent plain-text API: remove whole audited lines, never substrings
    # (a footer "1" must not eat a digit in the topic title or a body sentence).
    raw_lines = []
    for pn, page in enumerate(doc):
        excluded = collections.Counter(r['text'] for r in removed if r['page'] == pn + 1)
        plain = ''.join(b[4] for b in page.get_text('blocks', sort=True) if b[6] == 0) if order else page.get_text('text')
        for text in zw(plain).splitlines():
            text = norm(text)
            if excluded[text]:
                excluded[text] -= 1
            else:
                raw_lines.append(text)
        if any(excluded.values()):
            raise ValueError(f'Furniture missing from plain-text API: {excluded}')
    reference = norm(' '.join(raw_lines))

    blocks, section, toc = [], 'intro', False
    previous = None
    for line in lines:
        text = line['text']
        number = re.match(r'^(\d+(?:\.\d+)*)(?:\.|\s|(?=[A-Z]))', re.sub(r'(?<=\d)\s+(?=\.\d)', '', text))
        heading = bool(number and line['size'] >= 13.5 and line['bold'] > .55)
        # Week 8 numbers its third-level and last subsections (3.1.1, 5.2.1, 5.4) at body size.
        small_sub = bool(number and '.' in number.group(1) and 11.5 <= line['size'] < 13.5 and line['bold'] > .4)
        heading = heading or small_sub
        # Week 4's small TOC is unbolded; its body headings are 16/14 pt.
        kind = 'p'
        if 'AURKIBIDEA' in text:
            kind, toc = 'toc', True
        elif toc and week == 9:
            # Week 9's TOC numbers its sub-headings in bold capitals too: it ends at the grey note after it.
            toc = not text.startswith('Grisez dena')
        elif toc and week == 11:
            # Week 11's TOC sets each number ("2.1.") on its own bold line: it ends at the first body heading.
            toc = not text.startswith('1. SARRERA')
        elif toc and heading and (line['bold'] > .75 and text.upper() == text or text.startswith('0. 2.astearen') or line['size'] >= 15.5):
            # Some last TOC lines have an empty 22pt span: size above ignores it.
            toc = False
        if toc:
            kind = 'toc'
        elif line['size'] >= 20 and line['bold'] > .7:
            kind = 'title'
        elif heading:
            # "28. EGUNETIK AURRERA" and week 8's "5. astea" are headings inside a section.
            if int(number.group(1).split('.')[0]) <= 9 and not re.match(r'^\d+\.\s*astea', text, re.I):
                section = number.group(1)
                kind = 'h2' if '.' in section else 'h1'
            else:
                kind = 'h2'
        elif re.match(r'^(?:[●•➔\-]|\d+\.\u200b)', text):
            kind = 'li'
        # Weeks 11–14 wrap body text beside their figures (indented lines); week 12's tables have a right column.
        elif (line['italic'] and line['size'] <= 11.2 and len(text) < 110 and line['box'][0] > 100) or re.match(r'^\d+\.?\s*irudia', text, re.I) or (week not in {11, 12, 13, 14} and line['box'][0] > 150 and len(text) < 100 and not line['bold']):
            kind = 'caption'
        elif week == 14 and line['all_italic'] and line['size'] <= 11.2 and len(text) < 110:
            # Week 14's first caption sits left of its figure, at body indent.
            kind = 'caption'
        elif week == 12 and text.startswith(CAPTIONS_12) and len(text) < 64:
            kind = 'caption'
        elif week == 10 and line['italic'] and line['size'] <= 10.5:
            # Week 10 sets two figure captions side by side on one 10 pt italic row (wider than a caption).
            kind = 'caption'
        # TOC entries receive their target section without changing body context.
        gap = line['box'][1] - previous['box'][3] if previous else 999
        same_row = previous and line['page'] == previous['page'] and abs(line['box'][1] - previous['box'][1]) < 3
        block_section = number.group(1) if toc and number else (blocks[-1]['section'] if toc and same_row and blocks else section)
        continuation = blocks and block_section == blocks[-1]['section'] and (
            (kind == 'p' and blocks[-1]['kind'] in {'p', 'li'} and ((line['page'] == previous['page'] and gap < max(9, line['size'] * .55)) or (line['page'] != previous['page'] and not re.search(r'[.!?:]$', previous['text']) and not (week == 14 and blocks[-1]['kind'] == 'li'))))
            or (same_row and kind in {'p', 'li', 'caption', 'toc'} and blocks[-1]['kind'] in {'p', 'li', 'caption', 'toc'})
            # Week 12 sets its captions beside the body text: a body line after a caption starts a new block.
            or (kind in {'p', 'caption'} and blocks[-1]['kind'] == 'caption' and line['page'] == previous['page'] and gap < 9 and not (week == 10 and kind == 'p' and not line['italic']) and not (week == 12 and kind == 'p'))
            or (kind == 'title' and blocks[-1]['kind'] == 'title')
            or (kind == 'p' and blocks[-1]['kind'] in {'h1', 'h2'} and line['size'] >= 13.5 and line['bold'] > .7)
        )
        if continuation:
            blocks[-1]['parts'].extend([{'text': ' '}, *line['parts']])
        else:
            blocks.append({'kind': kind, 'section': block_section, 'parts': list(line['parts'])})
        previous = line
    counts = collections.Counter()
    for b in blocks:
        counts[b['section']] += 1
        # Week prefix avoids collisions between sections shared by different topics.
        bid = f"w{week}/{b['section']}/p{counts[b['section']]}"
        b['id'] = bid
        b['sentences'] = [{'id': f'{bid}/s{i}', 'parts': p} for i, p in enumerate(split_sentences(compact(b.pop('parts')), week), 1)]
    generated = norm(' '.join(block_text(b) for b in blocks))
    if generated != reference:
        print('\n'.join(difflib.unified_diff(reference.split(), generated.split(), fromfile='PDF', tofile='extracted', n=3)))
        raise ValueError(f'{path.name}: text fidelity failed')
    text = ' '.join(block_text(b) for b in blocks)
    meta = {'file': path.name, 'pages': len(doc), 'characters': len(text), 'sha256': hashlib.sha256(text.encode()).hexdigest(), 'removed': removed}
    return blocks, meta


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--source-dir', type=pathlib.Path, default=pathlib.Path.home() / 'Downloads')
    args = parser.parse_args()
    metadata = {}
    for week, filename in enumerate(FILES, 1):
        blocks, meta = extract(args.source_dir / filename, week)
        metadata[str(week)] = meta
        source = '// Generated by scripts/notes/extract.py from the ORIGINAL PDF. Do not edit.\nimport type { NotesBlock } from \'./index\';\n\nexport const w%d: NotesBlock[] = %s;\n' % (week, json.dumps(blocks, ensure_ascii=False, indent=2))
        dest = OUT / f'w{week}.ts'
        if args.check:
            if not dest.exists() or dest.read_text(encoding='utf-8') != source:
                print(f'w{week}: generated file differs; regenerate explicitly')
                return 1
        else:
            OUT.mkdir(parents=True, exist_ok=True)
            dest.write_text(source, encoding='utf-8', newline='\n')
        print(f'w{week}: {len(blocks)} blocks, {sum(len(b["sentences"]) for b in blocks)} sentences, {meta["characters"]} characters; PDF differences = 0; removed {len(meta["removed"])} header/footer lines')
    manifest = json.dumps(metadata, ensure_ascii=False, indent=2) + '\n'
    dest = OUT / 'manifest.json'
    if args.check:
        if not dest.exists() or dest.read_text(encoding='utf-8') != manifest:
            print('manifest differs')
            return 1
    else:
        dest.write_text(manifest, encoding='utf-8', newline='\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
