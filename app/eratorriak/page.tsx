import type { Metadata } from 'next';
import { Lineage } from '@/components/shell/Lineage';

export const metadata: Metadata = { title: 'Eratorriak — EnbrioAtlas' };

export default function DerivativesPage() {
  return <Lineage />;
}
