import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { structures, weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';

/**
 * What a step talks about must be on screen when the step shows it: drawn, named, and inside the
 * frame. Checked on the server-rendered SVG of every stage, in the view the player shows each step
 * in, at the frame the guided tour holds on and at the step's finished frame. A second check covers
 * every view (also the ones a viewer picks by hand): no name ever points outside the picture.
 */

const ctx: SceneContextValue = {
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? id,
  onSelect: () => {},
  onHover: () => {},
};

/** Processes and body axes are named by the step, not drawn as a thing of their own. */
const CONCEPT = new Set(['prozesua', 'ardatza']);

/**
 * Structures a step names while they change into something else (or are only named in the next
 * step), so by the tour and finished frames they are gone or not yet named. `week/stage/step/id` → why.
 */
const GONE: Record<string, string> = {
  '1/ibilbidea/2/folikulu-heldua': 'folikulua apurtzen da (obulazioa); gero gorputz luteoa',
  '1/ibilbidea/4/zigotoa': 'zigotoa 2 blastomero bihurtzen da urrats berean',
  '1/blastozistoa/2/mintz-peluzidoa': 'mintz peluzidoa galtzen du urrats honetan',
  '1/blastozistoa/3/blastozelea': 'barrunbe txikiak; blastozelea izena hurrengo urratsean',
  '1/habiratzea/2/endometrioa': 'hurbilketan haren osagaiak izendatzen dira (epitelioa, estroma, guruinak)',
  '2/eguna-9/5/garai-lakunarra': 'garaia da: bere txartelak izena darama',
  '2/eguna-11-12/6/enbrioi-kanpoko-mesodermoa': 'barrunbeak irekitzean bi orri bihurtzen da (hurrengo urratsa)',
  '4/neurulazioa/4/tolesdura-neuralak': 'fusionatu eta hodi neurala bihurtzen dira',
  '4/neurulazioa/8/neuroporo-kraneala': 'urrats honetan ixten da',
  '4/neurulazioa/8/neuroporo-kaudala': 'urrats honetan ixten da',
  '6/korion-hostotsua/6/dezidua-kapsularra': 'endekatzen da urrats honetan',
  '6/korion-hostotsua/6/umetoki-barrunbea': 'ixten da urrats honetan',
  '6/korion-hostotsua/7/korion-barrunbea': 'amniosak betetzen du urrats honetan',
};

/** A structure's name as the text uses it (case and the final article aside). */
const stem = (n: string) => n.toLowerCase().replace(/[()]/g, '').replace(/a$/, '');

/** Names a step's text says without showing them, on purpose: `week/stage/step/id` → why. */
const MENTION_ONLY: Record<string, string> = {
  '1/blastozistoa/2/blastozistoa': 'eraketa hasten da: oraindik morula da',
  '1/ernalkuntza/1/obulua': '"ez da obulua": ezeztapena',
  '1/ernalkuntza/6/obozito-sekundarioa': 'urrats honetan obulu bihurtzen da',
  '1/habiratzea/5/blastozistoa': 'ezohiko kokalekuak markatzen dira, ez blastozistoa bera',
  '2/eguna-13/5/hasierako-bitelo-zakua': 'txikitu eta bitelo zaku sekundarioak ordezkatzen du urrats honetan',
  '3/biloxkak/3/biloxka-primarioa': 'urrats honetan biloxka sekundario bihurtzen da',
  '3/gastrulazioa/10/hipoblastoa': '"alboetara baztertu da": diskotik kanpo, bitelo zakuaren paretan',
  '3/notokorda/4/notokorda': '"notokorda osatzean": geroago',
  '3/notokorda/7/hodi-neuroenterikoa': 'urrats honetan ixten da',
  '4/bitarteko-eta-alboko-mesodermoa/1/bitarteko-mesodermoa': 'bitarteko mesodermoa bere zatien izenez marraztuta: nefrotomak',
  '4/bitarteko-eta-alboko-mesodermoa/2/bitarteko-mesodermoa': 'bitarteko mesodermoa bere zatien izenez marraztuta: kordoi nefrogenoa',
  '4/bitarteko-eta-alboko-mesodermoa/4/kordoi-nefrogenoa': 'jatorria aipatzen da; irudian haren eratorriak (giltzurruna, gonadak)',
  '4/burmuin-bexikulak/6/hodi-neurala': 'hodi neuralaren alde kaudala ornomuina bezala marraztuta eta izendatuta',
  '4/gandor-neurala/2/azazkalak': 'etorkizuneko eratorria (eratorrien ikuspegian)',
  '4/gandor-neurala/2/ile-folikuluak': 'etorkizuneko eratorria (eratorrien ikuspegian)',
  '4/gandor-neurala/7/azaleko-ektodermoa': 'epidermisaren jatorria aipatzen da, mapa honetan ez',
  '4/somitaren-bereizketa/3/ornoak': '"hor eratuko dira": geroago',
  '4/somitaren-bereizketa/4/dermatoma': '"oraindik bereizi gabe": ezeztapena',
  '4/somitaren-bereizketa/4/miotoma': '"oraindik bereizi gabe": ezeztapena',
  '4/endodermoa/3/arnas-hastapena': 'maila gisa aipatuta; arnas hastapena 5. urratsean sortzen da',
  '4/tolespenak/7/endodermoa': 'urrats honetan hodi bihurtzen da: erdiko hestea (izenak gurutzatzen dira)',
  '5/enbrioia-28-32/7/kristalinoaren-plaka': 'urrats honetan inbaginatu eta hobitxo bihurtzen da',
  '5/enbrioia-42-56/3/belarriaren-pabiloia': '"garatuko da": geroago',
  '5/gorputz-adarrak/4/behatzak': 'hatzekin alderatzeko aipatuta (geroago)',
  '5/hirugarren-hilabetea/4/izterra': 'izterrezurra (hezurra) aipatzen da hezurtzapen-zentro gisa',
  '6/biloxka-askeak/4/zitotrofoblastoa': '"desagertzen dira": urrats honetan',
  '6/karena-aterminoa/1/karena': 'karena hemen karena aterminoa da (urratsaren fokua, izendatuta)',
  '6/karena-muga/1/zitotrofoblastoa': 'zitotrofoblasto zorroa aipatzen da (kanpoko zorroa, izendatuta)',
  '6/zilbor-hestea/1/hasierako-zilbor-hestea': 'eraztuna aipatzen da: zilbor-hestea geroago',
  '6/zilbor-hestea/7/korion-barrunbea': '"desagertzen da": urrats honetan',
  '6/zilbor-hestea/8/alantoidea': '"ixten dira": urrats honetan',
  '6/zilbor-hestea/8/heste-lakioak': 'abdomenera itzultzen dira: zilbor-hestetik kanpo',
  '6/zilbor-hestea/8/hodi-onfalomesenterikoa': '"desagertzen dira": urrats honetan',
};

/** Ids drawn only inside a figure part (no part of their own), named by a label on the spot. */
const LABEL_ONLY = new Set(['blastozistoa', 'bi-orriko-diskoa', 'gantz-metaketa', 'eskumuturra', 'karena']);

interface Seen {
  parts: Map<string, number>;
  labels: Map<string, number>;
  dots: { id: string; x: number; y: number; o: number }[];
}

/** HTML elements that never get a closing tag (inside foreignObject). */
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr', 'source', 'col', 'area', 'embed', 'track']);

function render(Scene: unknown, t: number): Seen {
  const html = renderToStaticMarkup(
    createElement(
      SceneContext.Provider,
      { value: ctx },
      createElement(LabelScaleContext.Provider, { value: { k: 1, left: false, right: false } }, createElement(Scene as never, { t, reduced: true })),
    ),
  );
  const parts = new Map<string, number>();
  const labels = new Map<string, number>();
  const dots: Seen['dots'] = [];
  // Walk the markup keeping the opacity every element really gets (its own × all its ancestors'), so a
  // structure faded by a wrapping group counts as faded too.
  const stack: { tag: string; o: number; label?: string }[] = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, self] = m;
    if (close) {
      while (stack.length && stack.pop()!.tag !== tag);
      continue;
    }
    const parent = stack[stack.length - 1];
    const own = /\sopacity="([^"]+)"/.exec(attrs);
    const o = (parent?.o ?? 1) * (own ? Number(own[1]) : 1);
    const part = /data-part="([^"]+)"/.exec(attrs)?.[1];
    const label = /data-label="([^"]+)"/.exec(attrs)?.[1] ?? parent?.label;
    if (part) parts.set(part, Math.max(parts.get(part) ?? 0, o));
    if (/data-label="/.test(attrs)) labels.set(label!, Math.max(labels.get(label!) ?? 0, o));
    const dot = /class="label-dot" cx="([^"]+)" cy="([^"]+)"/.exec(attrs);
    if (dot && label) dots.push({ id: label, x: Number(dot[1]), y: Number(dot[2]), o });
    if (!self && !VOID.has(tag)) stack.push({ tag, o, label });
  }
  return { parts, labels, dots };
}

/** The picture the viewer sees: the 1000×640 frame, less the tool column at the top right. */
const outside = (x: number, y: number) => x < 6 || x > 994 || y < 6 || y > 634 || (x > 932 && y < 222);

const viewOf = (stage: StageDef, k: number) => {
  const want = [...stage.beats.slice(0, k + 1)].reverse().find((b) => b.view && stage.views.some((v) => v.id === b.view))?.view;
  return stage.views.find((v) => v.id === want) ?? stage.views[0];
};

for (const w of weeks)
  describe(`${w.week}. gaia`, () => {
    for (const stage of w.stages)
      it(`${stage.id}: urrats bakoitzak aipatzen duena ikusten da`, () => {
        const problems: string[] = [];
        stage.beats.forEach((b, k) => {
          const end = k + 1 < stage.beats.length ? stage.beats[k + 1].at : 1;
          const view = viewOf(stage, k);
          const ids = [...new Set([...(b.focus ?? []), ...(b.tour ?? [])])];
          const frames = [
            { name: 'bira', t: b.tourAt ?? b.at + (end - b.at) * 0.75 },
            { name: 'amaiera', t: Math.max(b.at, end - 0.035) },
          ];
          for (const f of frames) {
            const seen = render(view.scene, f.t);
            for (const id of ids) {
              const where = `${k + 1}. urratsa [${view.id}] ${f.name} t=${f.t.toFixed(3)}: ${id}`;
              for (const d of seen.dots) if (d.id === id && d.o > 0.3 && outside(d.x, d.y)) problems.push(`${where} — izenaren lerroa irudiz kanpo (${d.x.toFixed(0)}, ${d.y.toFixed(0)})`);
              if (CONCEPT.has(structures.get(id)?.category ?? '')) continue;
              if (GONE[`${w.week}/${stage.id}/${k + 1}/${id}`]) continue;
              const drawn = (seen.parts.get(id) ?? 0) > 0.3 || (LABEL_ONLY.has(id) && (seen.labels.get(id) ?? 0) > 0.3);
              const named = (seen.labels.get(id) ?? 0) > 0.3;
              if (!drawn) problems.push(`${where} — ez dago marraztuta`);
              else if (!named) problems.push(`${where} — marraztuta baina izenik gabe`);
            }
          }
        });
        expect(problems).toEqual([]);
      });

    for (const stage of w.stages)
      it(`${stage.id}: urratsaren testuak aipatzen duena ere ikusten da`, () => {
        const problems: string[] = [];
        stage.beats.forEach((b, k) => {
          const end = k + 1 < stage.beats.length ? stage.beats[k + 1].at : 1;
          const view = viewOf(stage, k);
          const said = b.text.toLowerCase();
          // Where each structure of the stage is said (a whole word start), longest names first: a name said
          // only inside a longer one ("kloaka" in "kloaka mintza") is not a mention of its own.
          const spans = stage.structures
            .flatMap((id) => {
              const s = structures.get(id);
              // Names are plain words (letters, spaces, hyphens): safe to use as a pattern.
              return s ? [s.name, ...(s.aka ?? [])].map(stem).filter((n) => n.length > 4).flatMap((n) => [...said.matchAll(new RegExp('(?<!\\p{L})' + n, 'gu'))].map((m) => ({ id, a: m.index!, b: m.index! + n.length }))) : [];
            })
            .sort((p, q) => q.b - q.a - (p.b - p.a));
          const taken: { a: number; b: number }[] = [];
          const said_ = new Set<string>();
          for (const sp of spans) {
            if (taken.some((q) => sp.a >= q.a && sp.b <= q.b)) continue;
            taken.push(sp);
            said_.add(sp.id);
          }
          const ids = [...said_].filter((id) => {
            const s = structures.get(id)!;
            return !CONCEPT.has(s.category) && !(b.focus ?? []).includes(id) && !(b.tour ?? []).includes(id);
          });
          if (!ids.length) return;
          const seen = render(view.scene, Math.max(b.at, end - 0.035));
          for (const id of ids) {
            if (MENTION_ONLY[`${w.week}/${stage.id}/${k + 1}/${id}`]) continue;
            const drawn = (seen.parts.get(id) ?? 0) > 0.3 || (seen.labels.get(id) ?? 0) > 0.3;
            if (!drawn) problems.push(`${k + 1}. urratsa [${view.id}]: ${id} — testuan aipatuta, irudian ez`);
          }
        });
        expect(problems).toEqual([]);
      });

    for (const stage of w.stages)
      it(`${stage.id}: ikuspegi guztietan izenek irudi barrura seinalatzen dute`, { timeout: 60000 }, () => {
        const problems: string[] = [];
        for (const view of stage.views)
          for (let t = 0; t <= 1.0001; t += 0.05) {
            const seen = render(view.scene, Math.min(1, t));
            for (const d of seen.dots) if (d.o > 0.3 && outside(d.x, d.y)) problems.push(`[${view.id}] t=${t.toFixed(2)}: ${d.id} (${d.x.toFixed(0)}, ${d.y.toFixed(0)})`);
          }
        expect([...new Set(problems)]).toEqual([]);
      });
  });
