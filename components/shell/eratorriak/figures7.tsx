'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CAVITIES, ORGANS7, ORIGINS7 } from '@/content/eratorriak/cavities';
import type { ShowInTimeline } from './kit/StudyRoom';
import { TestTable } from './kit/TestTable';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

export function CavityFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div>
      <div className={extra.figureGrid}>
        <article className={styles.figCard}>
          <h4>Zeloma gorputz barruan gelditzen da</h4>
          <FoldingFigure />
          <p>
            Zeharkako tolespenean alboko ertzak aurrera eta erdialdera abiatzen dira. Zefalokaudaleko tolespenarekin batera, zeloma gorputz
            barruan isolatzen da. Alboko mesodermoak paretako eta errai orria ditu.
          </p>
          <p className={extra.source}>Apunteak 1 · morea: zeloma; arrosa: paretako orria; laranja: errai orria; horia: hestea.</p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['coelom', 'parietal', 'visceral'], 0)}>
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Mesenterioa: bi orriko lotura</h4>
          <MesenteryFigure />
          <p>
            Atzeko mesenterioa / mesenterio dortsala: paretako eta errai orrien arteko bi orriko lotura. Zenbait organoren posizio aldaketan
            atzeko paretako peritoneoarekin fusionatzen da; organoa peritoneo atzeko bihurtzen da.
          </p>
          <p className={extra.source}>
            Apunteak 2.1 · laranja: errai peritoneoa; arrosa: paretako peritoneoa; horia: organoa. Atzea goian.
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['mesentery', 'parietal', 'visceral'], 5)}>
            Eskeman ikusi →
          </button>
        </article>
      </div>
      <div className={extra.figureGrid} style={{ marginTop: 14 }}>
        <article className={styles.figCard}>
          <h4>C3–C5: zergatik heltzen dira nerbio frenikoak?</h4>
          <DescentFigure />
          <p>
            Somita zerbikalen mailan bereizitako mioblastoak → miozitoak; nerbio espinalen aurreko adarretako zuntzak haiengana iristen
            dira. Septuma jaistean nerbioak luzatzen dira. Miozitoek mintz pleuroperitonealetara ere migratzen dute.
          </p>
          <p className={extra.source}>
            Apunteak 3–3.1 · horia: nerbio frenikoa; laranja: septum transversuma. Alboko eskema, ez enbrioi osoa.
          </p>
          <Link className={styles.linkBtn} href="/astea/7?etapa=diafragma-eraketa">
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Diafragma: muskuluaren atalak eta igarobideak</h4>
          <DiaphragmParts />
          <p>
            Bularrezur atala: bularrezurraren atzeko aurpegian. Saihets atala: 7.–12. saihetsetan. Gerriko atala: eskuineko zutabea L1–L3
            (luzeagoa), ezkerrekoa L1–L2. Bien artean erdiko lotailu arkutua.
          </p>
          <p className={extra.source}>
            Apunteak 3.1 · goiko kupula: muskulu eta tendoi zatien eskema; gerriko bi zutabeak behean. Aurretik: enbrioiaren eskuina zure
            ezkerrean.
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['septum', 'poR', 'poL', 'esophageal', 'peripheral'], 5)}>
            Eskeman ikusi →
          </button>
        </article>
      </div>
      <h4 style={{ marginTop: 24 }}>Peritoneoa: organoen erlazioa</h4>
      <p className={styles.blockLead}>
        Erlazioa eta jatorria ez dira gauza bera. Taulak apunteetako adibideak biltzen ditu (2.1); ez du beste gaietako salbuespenik
        gehitzen.
      </p>
      <TestTable data={CAVITIES} rows={ORGANS7} columns={['Peritoneoarekiko erlazioa', 'Zergatia / mekanismoa']} />
      <p className={styles.figCaption}>
        Mediastinoa bi pleuren artean dago: aurrekoa, bitartekoa (perikardioa) eta atzekoa. Atzekoan hestegorria, toraxeko aorta, X.
        nerbioak eta linfa enborrak jaisten dira; ez daude zelomaren barnean (2.2).
      </p>
    </div>
  );
}
function FoldingFigure() {
  return (
    <svg
      viewBox="0 0 700 300"
      role="img"
      aria-label="Zeharkako tolespena: zeloma kanpoarekin jarraitua izatetik gorputz barruan isolatzera"
    >
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 230},0)`}>
          <text x="110" y="25" textAnchor="middle">
            {['1 · Disko laua', '2 · Alboko tolespena', '3 · Zeloma isolatua'][i]}
          </text>
          {i === 0 ? (
            <>
              <path d="M20,100 L200,100" stroke="#ffb3a1" strokeWidth="12" />
              <path d="M20,155 L200,155" stroke="#ffc98f" strokeWidth="12" />
              <path d="M20,125 L200,125" stroke="#a77cff" strokeWidth="28" opacity=".6" />
              <path d="M20,190 L200,190" stroke="#f2c14e" strokeWidth="10" />
            </>
          ) : (
            <>
              <path
                d={
                  i === 1 ? 'M30,100 Q20,220 80,235 M190,100 Q200,220 140,235' : 'M30,120 Q20,235 110,250 Q200,235 190,120 Q110,60 30,120Z'
                }
                fill="none"
                stroke="#ffb3a1"
                strokeWidth="10"
              />
              <path d="M60,120 Q50,205 95,210 M160,120 Q170,205 125,210" stroke="#ffc98f" strokeWidth="9" fill="none" />
              <path d="M45,125 Q35,210 83,220 M175,125 Q185,210 137,220" stroke="#a77cff" strokeWidth="14" opacity=".7" fill="none" />
              <path
                d={i === 1 ? 'M85,150 Q110,125 135,150 L135,230 M85,150 L85,230' : 'M85,150 Q110,125 135,150 L135,195 Q110,225 85,195Z'}
                fill="none"
                stroke="#f2c14e"
                strokeWidth="8"
              />
            </>
          )}
          <text x="110" y="285" textAnchor="middle" style={{ fontSize: 12 }}>
            {i === 0 ? 'kanpoarekin komunikatua' : i === 1 ? 'ertzak aurrera eta erdira' : 'gorputz barruko espazioa'}
          </text>
        </g>
      ))}
    </svg>
  );
}
function MesenteryFigure() {
  return (
    <svg viewBox="0 0 700 300" role="img" aria-label="Atzeko mesenterioaren bi orriak eta bigarren mailako atzeko kokapena">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 230},0)`}>
          <text x="110" y="25" textAnchor="middle">
            {['Hasieran', 'Hurbildu', 'Fusionatu'][i]}
          </text>
          <ellipse cx="110" cy="160" rx="94" ry="110" fill="#5a3644" opacity=".3" />
          <ellipse cx="110" cy="160" rx="85" ry="100" fill="none" stroke="#ffb3a1" strokeWidth="7" />
          {i < 2 && <path d={`M100,60 L100,${i === 0 ? 145 : 94} M120,60 L120,${i === 0 ? 145 : 94}`} stroke="#ffc98f" strokeWidth="6" />}
          <ellipse cx="110" cy={i === 0 ? 175 : i === 1 ? 120 : 88} rx="31" ry="30" fill="#f2c14e" stroke="#ffc98f" strokeWidth="6" />
          <text x="110" y="295" textAnchor="middle" style={{ fontSize: 12 }}>
            {i === 2 ? 'peritoneo atzeko egitura' : 'peritoneo barruko egitura'}
          </text>
        </g>
      ))}
    </svg>
  );
}
function DescentFigure() {
  const [late, setLate] = useState(false);
  const y = late ? 330 : 145;
  return (
    <div>
      <div className={styles.figBar}>
        <div className={styles.seg2} role="group" aria-label="Septumaren jaitsiera">
          <button type="button" aria-pressed={!late} className={!late ? styles.on : ''} onClick={() => setLate(false)}>
            Lepoan
          </button>
          <button type="button" aria-pressed={late} className={late ? styles.on : ''} onClick={() => setLate(true)}>
            Jaitsi ondoren
          </button>
        </div>
      </div>
      <svg
        viewBox="0 0 560 440"
        role="img"
        aria-label={late ? 'Septumaren jaitsiera; nerbio frenikoa luzatua' : 'Septum transversuma C3–C5 mailan'}
      >
        <path d="M160,50 L160,400" stroke="#e8e1cf" strokeWidth="15" />
        {[70, 95, 120].map((v, i) => (
          <g key={v}>
            <path d={`M170,${v} L270,135 L300,${y}`} stroke="#fde047" strokeWidth="4" fill="none" />
            <text x="30" y={v + 5}>
              C{i + 3}
            </text>
          </g>
        ))}
        <path d={`M240,${y + 15} Q320,${y - 20} 405,${y + 25}`} stroke={ORIGINS7.st.color} strokeWidth="20" fill="none" />
        <text x="320" y={y + 65} textAnchor="middle">
          septum transversuma
        </text>
        <text x="320" y="35" textAnchor="middle">
          nerbio frenikoa
        </text>
        {late && (
          <>
            <text x="25" y="260">
              5. astearen amaieran:
            </text>
            <text x="25" y="285">
              aurrea T7 · atzea T12
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
function DiaphragmParts() {
  return (
    <svg viewBox="0 0 640 490" role="img" aria-label="Diafragmaren zentro tendinosoa, hiru muskulu atalak, bi zutabeak eta igarobideak">
      <path d="M140,260 Q140,110 320,90 Q500,110 500,260 L470,335 Q320,270 170,335Z" fill="#c06c94" opacity=".7" />
      <path d="M260,170 Q320,135 380,170 L395,245 Q320,280 245,245Z" fill="#f2a65a" />
      <path d="M240,285 L215,435 M400,285 L420,415" stroke="#5ec2b0" strokeWidth="26" strokeLinecap="round" />
      <path d="M240,300 Q320,245 400,300" stroke="#e8e1cf" strokeWidth="7" fill="none" />
      <ellipse cx="280" cy="215" rx="17" ry="13" fill="#0e0d11" />
      <ellipse cx="360" cy="250" rx="14" ry="13" fill="#0e0d11" />
      <path d="M299,289 Q320,265 341,289Z" fill="#0e0d11" />
      <text x="320" y="45" textAnchor="middle">
        bularrezur atala
      </text>
      <text x="15" y="160">
        saihets atala
      </text>
      <text x="15" y="180">
        7.–12.
      </text>
      <text x="320" y="130" textAnchor="middle">
        zentro tendinosoa
      </text>
      <text x="15" y="220">
        beheko kaba
      </text>
      <text x="450" y="250">
        hestegorria
      </text>
      <text x="450" y="310">
        aorta · T12
      </text>
      <text x="80" y="450">
        eskuinekoa L1–L3
      </text>
      <text x="365" y="450">
        ezkerrekoa L1–L2
      </text>
      <text x="320" y="485" textAnchor="middle">
        gerriko atala · bi zutabe
      </text>
    </svg>
  );
}
