import { NextResponse } from 'next/server';
import { allow, cached, remember } from '@/lib/kimu/guard';
import { askGroq, groqConfigured, parseAnswer } from '@/lib/kimu/groq';
import { buildMessages } from '@/lib/kimu/prompt';
import type { KimuAsk, KimuModelReply, KimuTurn } from '@/lib/kimu/types';

export const runtime = 'nodejs';
export const maxDuration = 20;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

/**
 * The server is only the bridge to the model: the browser does the searching (the course content lives
 * in client modules) and sends the few passages the answer may use. Everything is size-capped, so a
 * request cannot cost more than a few thousand tokens whatever it contains.
 */
function readAsk(body: unknown): KimuAsk | null {
  if (!isRecord(body)) return null;
  const question = text(body.question, 400).replace(/\s+/g, ' ').trim();
  if (question.length < 2) return null;
  const history: KimuTurn[] = Array.isArray(body.history)
    ? body.history
        .filter((t): t is { role: 'user' | 'kimu'; text: string } => isRecord(t) && (t.role === 'user' || t.role === 'kimu') && typeof t.text === 'string')
        .slice(-6)
        .map((t) => ({ role: t.role, text: t.text.slice(0, 600) }))
    : [];
  const notes = Array.isArray(body.notes) ? body.notes.filter((n): n is string => typeof n === 'string').slice(0, 4).map((n) => n.slice(0, 600)) : [];
  const h = body.here;
  const here = isRecord(h) ? { title: text(h.title, 120), step: text(h.step, 340), picked: text(h.picked, 280) } : null;
  const lang = body.lang === 'es' || body.lang === 'en' ? body.lang : 'eu';
  return { question, history, notes, here, lang };
}

const reply = (r: KimuModelReply) => NextResponse.json(r);

export async function POST(request: Request) {
  let ask: KimuAsk | null = null;
  try {
    ask = readAsk(await request.json());
  } catch {
    // Handled below.
  }
  if (!ask) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  if (!groqConfigured()) return reply({ ok: false, reason: 'nokey' });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allow(ip)) return reply({ ok: false, reason: 'limit' });

  // A popular first question costs the free tier nothing the second time.
  const key = `${ask.lang}|${ask.question.toLowerCase()}|${ask.notes.join('|')}|${ask.here?.title ?? ''}`;
  const fresh = ask.history.length === 0;
  const hit = fresh ? cached<KimuModelReply>(key) : null;
  if (hit) return reply(hit);

  const raw = await askGroq(buildMessages(ask));
  const answer = raw ? parseAnswer(raw) : null;
  if (!answer) return reply({ ok: false, reason: 'error' });

  const out: KimuModelReply = { ok: true, ...answer };
  if (fresh) remember(key, out);
  return reply(out);
}
