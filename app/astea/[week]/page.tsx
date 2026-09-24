import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Simulator } from '@/components/shell/Simulator';
import { getWeek, weeks } from '@/content/registry';

export function generateStaticParams() {
  return weeks.map((w) => ({ week: String(w.week) }));
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const w = getWeek(Number(week));
  return { title: w ? `${w.week}. astea · ${w.title} — EnbrioAtlas` : 'EnbrioAtlas' };
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = getWeek(Number(week));
  if (!w) notFound();
  return <Simulator weekNumber={w.week} />;
}
