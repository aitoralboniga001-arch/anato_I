"""Read-only candidate ranking. Proposals must be reviewed; never edits beats."""
import argparse
import json
import pathlib
import re
import subprocess
import sys
import unicodedata
from collections import Counter
from math import log

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load_notes(week):
    source = (ROOT / 'content/notes-text' / f'w{week}.ts').read_text(encoding='utf-8')
    return json.loads(source.split(' = ', 1)[1].rstrip(';\n'))


def allowed(section, config):
    numbers = re.findall(r'\d+(?:\.\d+)?', config['n'])
    # Explicit numeric covers only (e.g. ectopic locations 4.6).
    numbers += re.findall(r'(?<!\d)\d+\.\d+', config.get('covers', ''))
    return any(section == n or section.startswith(n + '.') for n in numbers)


def tokens(text):
    text = ''.join(c for c in unicodedata.normalize('NFD', text.lower()) if not unicodedata.combining(c))
    stop = {'dira', 'dago', 'duen', 'dute', 'honen', 'hori', 'hau', 'hori', 'dela', 'baina', 'beraz', 'zein', 'beste', 'arte', 'bidez', 'izango', 'gertatzen', 'agertzen', 'egiten', 'dena', 'gero', 'aldi', 'guztiak'}
    # Basque suffixes: compare stems, while retaining discriminating nouns.
    return {w[:8] for w in re.findall(r'[a-z]{4,}', text) if w not in stop}


def suggest(week=None):
    catalog = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/notes/catalog.cjs')], cwd=ROOT))
    documents = {w: load_notes(w) for w in range(1, 7)}
    result = []
    for stage in catalog['stages']:
        w = stage['week']
        if week and week != w:
            continue
        config = next(s for s in catalog['sections'][str(w)] if stage['id'] in s['stages'])
        pool = [(s, b) for b in documents[w] if b['kind'] not in {'toc', 'title', 'h1', 'h2'} and (allowed(b['section'], config) or (w == 1 and stage['id'] == 'ibilbidea' and b['section'] in {'4.2', '4.3', '4.4', '4.5'})) for s in b['sentences']]
        freq = Counter(t for s, b in pool for t in tokens(''.join(p['text'] for p in s['parts'])))
        for i, beat in enumerate(stage['beats']):
            query = tokens(' '.join(str(beat.get(k) or '') for k in ['text', 'idea', 'key']))
            scored = []
            for s, b in pool:
                text = ''.join(p['text'] for p in s['parts'])
                shared = query & tokens(text)
                score = sum(log(1 + len(pool) / freq[t]) for t in shared)
                scored.append({'id': s['id'], 'text': text, 'kind': b['kind'], 'score': round(score, 2)})
            result.append({'week': w, 'file': stage['file'], 'stageId': stage['id'], 'beat': i, 'at': beat['at'], 'text': beat['text'], 'candidates': sorted(scored, key=lambda s: s['score'], reverse=True)[:5]})
    return result


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--week', type=int, choices=range(1, 7))
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    results = suggest(args.week)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for row in results:
            print(f'\nw{row["week"]}/{row["stageId"]} #{row["beat"] + 1}: {row["text"]}')
            for s in row['candidates']:
                print(f'  {s["score"]:5.2f} {s["id"]}: {s["text"]}')
