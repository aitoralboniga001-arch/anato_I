import type { ChatMessage } from './prompt';
import { REPLY_SCHEMA } from './prompt';


const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

export const groqConfigured = () => !!process.env.GROQ_API_KEY;

export interface ModelAnswer {
  reply: string;
  /** Notes passages the reply rests on ("n1"…). */
  cite: string[];
  /** Simulator places to open ("c1"…). */
  go: string[];
  followups: string[];
}

async function call(messages: ChatMessage[], structured: boolean, signal: AbortSignal) {
  const body: Record<string, unknown> = {
    model: process.env.KIMU_MODEL || DEFAULT_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 360,
    // Instruct mode: no hidden reasoning, so the answer is fast and the tokens go to the reply.
    reasoning_effort: 'none',
  };
  if (structured) body.response_format = { type: 'json_schema', json_schema: { name: 'kimu_reply', schema: REPLY_SCHEMA } };
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(body),
    signal,
  });
}

/** The model's raw text, or null when it could not answer (no key, limit reached, error, timeout). */
export async function askGroq(messages: ChatMessage[]): Promise<string | null> {
  if (!groqConfigured()) return null;
  const signal = AbortSignal.timeout(8000);
  try {
    let res = await call(messages, true, signal);
    // A model or account that rejects structured output still answers when asked in plain words.
    if (res.status === 400) res = await call(messages, false, signal);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

/** Tolerant reading of the model's JSON (it may add prose or thinking around it). */
export function parseAnswer(raw: string): ModelAnswer | null {
  const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(text.slice(start, end + 1)) as Partial<Record<keyof ModelAnswer, unknown>>;
      if (typeof j.reply === 'string' && j.reply.trim()) {
        const list = (v: unknown, n: number, len: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, n).map((x) => clip(x.trim(), len)) : []);
        return {
          reply: clip(j.reply.trim(), 800),
          cite: list(j.cite, 3, 8),
          go: list(j.go, 2, 8),
          followups: list(j.followups, 3, 70),
        };
      }
    } catch {
      // Fall through: treat the text as the reply.
    }
  }
  return { reply: clip(text.replace(/[{}"]/g, '').trim(), 800), cite: [], go: [], followups: [] };
}
