import type { Metadata } from 'next';
import { Timeline } from '@/components/shell/Timeline';

export const metadata: Metadata = { title: 'Kronologia: zer dago orain? — EnbrioAtlas' };

export default function ChronologyPage() {
  return <Timeline />;
}
