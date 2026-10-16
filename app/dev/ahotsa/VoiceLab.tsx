'use client';

import { useEffect, useRef, useState } from 'react';
import { ClassVoice, rankVoices, loadVoices, type VoiceChoice } from '@/lib/klasea/voice';
import { spokenText } from '@/lib/klasea/speak-eu';

const SAMPLES = [
  '21. egunean, bihotz hodian estuguneak agertzen dira, eta atal desberdinak eratzen dira goitik behera.',
  'Alde zefalikoa aurrera, behera eta eskuinera doa; alde kaudala, berriz, atzera, gora eta ezkerrera.',
  'Zain sinuaren ezkerreko luzapenetik sinu koronarioa sortzen da.',
  'Tolespen zefalokaudalak plaka kardiogenikoa torax barrunbera eramaten du, garun xixkuen alde kaudalera.',
  'Septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira.',
];

export function VoiceLab() {
  const [voices, setVoices] = useState<VoiceChoice[]>([]);
  const [line, setLine] = useState('');
  const voice = useRef<ClassVoice | null>(null);

  useEffect(() => {
    voice.current = new ClassVoice();
    void loadVoices().then((v) => setVoices(rankVoices(v)));
    return () => voice.current?.cancel();
  }, []);

  const say = (c: VoiceChoice, text: string, stress: boolean) => {
    const v = voice.current!;
    v.use(c);
    v.stress = stress;
    v.prime();
    setLine(spokenText(text, c.kind, stress));
    v.speak(text, { onEnd: () => setLine('') });
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui', color: 'var(--ink, #111)', background: 'var(--bg, #fff)' }}>
      <h1>Ahotsak: 10. gaiko klasea</h1>
      <p>Arakatzaile honen ahotsak, ordenan (lehena da klaseak hautatzen duena). «Azentua» botoiak espainierazko ahotsaren azentu-arau gabe irakurtzen du.</p>
      {!voices.length && <p><b>Ez dago euskarazko edo gaztelaniazko ahotsik.</b> Klaseak azpitituluekin funtzionatzen du.</p>}
      {line && <p data-testid="spoken"><code>{line}</code></p>}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th align="left">Ahotsa</th><th align="left">Hizkuntza</th><th align="left">Lokala</th><th align="left">Esaldiak</th></tr>
        </thead>
        <tbody>
          {voices.map((c) => (
            <tr key={c.voice.name} style={{ borderTop: '1px solid #ccc' }}>
              <td>{c.voice.name}</td>
              <td>{c.voice.lang}</td>
              <td>{c.voice.localService ? 'bai' : 'ez (sarea)'}</td>
              <td>
                {SAMPLES.map((s, i) => (
                  <span key={i} style={{ marginRight: 6 }}>
                    <button onClick={() => say(c, s, true)}>{i + 1}</button>
                    {c.kind === 'es' && <button onClick={() => say(c, s, false)} title="Azentu-araurik gabe">{i + 1}′</button>}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Esaldiak</h2>
      <ol>{SAMPLES.map((s) => <li key={s}>{s}<br /><small>es: {spokenText(s, 'es')}</small></li>)}</ol>
    </main>
  );
}
