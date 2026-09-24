import type { Metadata } from 'next';
import { Lineage } from '@/components/shell/Lineage';

export const metadata: Metadata = { title: 'Ernetze orrien leinuak — EnbrioAtlas' };

export default function LineagePage() {
  return <Lineage />;
}
