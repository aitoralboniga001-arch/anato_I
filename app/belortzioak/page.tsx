import type { Metadata } from 'next';
import { Belortzioak } from '@/components/shell/Belortzioak';

export const metadata: Metadata = { title: 'Belortzioak: gezia → izena — EnbrioAtlas' };

export default function BelortzioakPage() {
  return <Belortzioak />;
}
