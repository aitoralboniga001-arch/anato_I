/**
 * HITO-DATAK: the key dates of the notes (the day the chorionic cavity forms…), pinned to
 * the step where the animation shows them. The simulator stamps them on the scene while that step
 * plays, so the picture and the calendar are learnt together. Every date is taken from the step's own
 * text (checked by the tests), which is faithful to the notes.
 */
import type { StageDef } from '@/lib/sim/types';

export interface ExamDate {
  /** The date as the notes write it: "11–12. egunak", "≈25. eguna", "12. astea". */
  when: string;
  /** What happens then, in a few words. */
  what: string;
}

type ByAt = Record<number, ExamDate[]>;
const m = (when: string, what: string): ExamDate => ({ when, what });

/** `week/stageId` → beat `at` → exam dates. */
export const EXAM_DATES: Record<string, ByAt> = {
  '1/ibilbidea': {
    0.5: [m('3. eguna', 'Morula tronparen istmoan')],
    0.62: [m('4. eguna', 'Umetokira sartu; mintz peluzidoa galdu')],
    0.74: [m('4,5–5. egunak', 'Blastozistoa umetoki-barrunbean')],
    0.86: [m('5,5–6. egunak', 'Habiratzea endometrioan')],
  },
  '1/ernalkuntza': { 0.92: [m('0. eguna', 'Zigotoa: 1. astea hasten da')] },
  '1/segmentazioa': {
    0.66: [m('3. eguna', 'Morula (12–16 zelula)')],
    0.86: [m('4. eguna', '~32 zelula')],
  },
  '1/blastozistoa': { 0: [m('4–5. egunak', 'Morula umetoki-barrunbean')] },
  '1/habiratzea': { 0.66: [m('6. eguna', 'Habiratzea hasten da')] },

  '2/eguna-8': {
    0.4: [m('8. eguna', 'Bi orriko diskoa')],
    0.47: [m('8. eguna', 'Amnios barrunbea')],
  },
  '2/eguna-9': {
    0.5: [m('9. eguna', 'Garai lakunarra')],
    0.56: [m('9. eguna', 'Heuser-en mintza')],
  },
  '2/eguna-11-12': {
    0.28: [m('11–12. egunak', 'Lakuak amaren odolez: zirkulazio uteroplazentarioa')],
    0.42: [m('11–12. egunak', 'Enbrioi kanpoko mesodermoa')],
    0.54: [m('11–12. egunak', 'Korion barrunbea')],
  },
  '2/eguna-13': {
    0.08: [m('13. eguna', 'Biloxka primarioak')],
    0.5: [m('13. eguna', 'Bitelo zaku sekundarioa')],
  },

  '3/gastrulazioa': { 0.08: [m('15–16. egunak', 'Lerro primitiboa: gastrulazioa hasten da')] },
  '3/alantoidea-eta-hazkundea': { 0.72: [m('16. eguna', 'Alantoidea')] },
  '3/biloxkak': {
    0: [m('13. eguna', 'Biloxka primarioak')],
    0.3: [m('3. astea (hasiera/erdia)', 'Biloxka sekundarioak')],
    0.67: [m('3. astearen amaiera', 'Biloxka tertziarioak')],
  },
  '3/zirkulazioa': { 0.65: [m('4. astea', 'Bihotzak taupadak egiten ditu')] },

  '4/neurulazioa': { 0.9: [m('≈25. eguna', 'Neuroporo kraneala ixten da'), m('≈28. eguna', 'Neuroporo kaudala ixten da')] },
  '4/mesodermoa-banatzen': { 0.1: [m('~17. eguna', 'Mesodermo paraxiala loditzen da')] },
  '4/somitak': { 0.12: [m('20. eguna', 'Lehen somita bikotea (okzipitala)')] },

  '5/enbrioia-28-32': {
    0: [m('28. eguna', 'C itxura; ~28 somita bikote')],
    0.74: [m('32. eguna', 'Sudur plaka eta hodi kristalinoa')],
  },
  '5/enbrioia-42-56': {
    0.13: [m('42. eguna', 'Begi pigmentatua eta betazala')],
    0.5: [m('48. eguna', 'Bigarren ertzadura (3 segmentu)')],
    0.78: [m('56. eguna', 'Sudurra, ahoa, maxilarra; giltzadurak')],
  },
  '5/gorputz-adarrak': {
    0.18: [m('42. eguna', 'Lehen ertzadura')],
    0.66: [m('48. eguna', 'Bigarren ertzadura (3 segmentu)')],
  },
  '5/iraupena': {
    0.2: [m('280 egun', 'Azken hilekotik (40 aste)')],
    0.42: [m('266 egun', 'Ernalkuntzatik (38 aste)')],
    0.62: [m('3.–8. asteak', 'Enbrioi aroa; 9. astetik, fetu aroa')],
  },
  '5/buruaren-proportzioa': {
    0.24: [m('3. hilabetea', 'Burua ≈ luzeraren ½')],
    0.52: [m('5. hilabetea', 'Burua ≈ luzeraren ⅓')],
    0.8: [m('Jaiotzean', 'Burua ≈ luzeraren ¼')],
  },
  '5/hirugarren-hilabetea': {
    0.16: [m('11. astea', 'Aurpegiak giza itxura')],
    0.46: [m('12. astea', 'Hezurtzapen zentro primarioak')],
    0.6: [m('6. astetik', 'Ernia fisiologikoa')],
    0.74: [m('12. astea', 'Heste lakioak abdomenera itzuli')],
    0.86: [m('12. astea', 'Sexua jakin daiteke')],
  },
  '5/laugarren-bosgarren': {
    0.28: [m('5. hilabetearen bukaera', '~15 cm eta ~500 g')],
    0.76: [m('4.–5. hilabetea', 'Amak mugimenduak antzematen ditu')],
  },
  '5/azken-hilabeteak': {
    0.3: [m('6. hilabetea', 'Bizirautea zaila')],
    0.44: [m('7. hilabetea', 'Bizirautea %90 inguru')],
    0.72: [m('8.–9. hilabeteak', 'Vernix caseosa')],
    0.86: [m('Jaiotzean', '3–3,4 kg')],
  },

  '6/karena-muga': { 0: [m('2. hilabetearen hasiera', 'Biloxka sekundario eta tertziarioak')] },
  '6/biloxka-askeak': {
    0.34: [m('4. hilabetetik', 'Biloxka askeen paretetan desagerpena')],
    0.5: [m('4. hilabetetik', 'Karena muga: bi geruza')],
  },
  '6/korion-hostotsua': { 0.26: [m('3. hilabetea', 'Korion leuna (biloxkarik gabe)')] },
  '6/kotiledoiak': { 0.38: [m('4.–5. hilabeteak', 'Deziduaren trenkadak: kotiledoiak')] },
  '6/zilbor-hestea': {
    0.74: [m('3. hilabetetik', 'Behin-betiko zilbor-hestea')],
    0.86: [m('12. astetik', 'Heste lakioak abdomenera')],
  },
  '6/likido-amniotikoa': {
    0.3: [m('10. astea', '30 ml'), m('30. astea', '200–500 ml'), m('37.–38. astea', '800–1000 ml')],
    0.88: [m('14. astea', 'Amniozentesia ez lehenago')],
  },
};

/** The exam dates pinned to the step that starts at `at`. */
export const examDatesAt = (week: number, stageId: string, at: number | undefined): ExamDate[] => (at === undefined ? undefined : EXAM_DATES[`${week}/${stageId}`]?.[at]) ?? [];

/** All exam dates of a stage, with the step they belong to (for the exam-date list). */
export const stageExamDates = (week: number, stage: StageDef) =>
  stage.beats.flatMap((b, k) => (EXAM_DATES[`${week}/${stage.id}`]?.[b.at] ?? []).map((ms) => ({ ...ms, k })));
