import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IkasgelaPage } from '@/components/shell/IkasgelaPage';
import { hasRoom, ROOM_WEEKS } from '@/components/shell/eratorriak/roomWeeks';
import { getWeek } from '@/content/registry';

export function generateStaticParams() {
  return ROOM_WEEKS.map((week) => ({ week: String(week) }));
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const w = getWeek(Number(week));
  return { title: w ? `${w.week}. gaia · Ikasgela — EnbrioAtlas` : 'EnbrioAtlas' };
}

export default async function RoomPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  if (!hasRoom(Number(week))) notFound();
  return <IkasgelaPage week={Number(week)} />;
}
