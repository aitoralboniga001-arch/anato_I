import type { Metadata } from 'next';
import { StructureAtlas } from '@/components/shell/StructureAtlas';

export const metadata: Metadata = {
  title: 'Egituren atlasa — EnbrioAtlas',
  description: '1.–9. gaietako egiturak, haien jatorriak, eraldaketak eta eratorriak.',
};

export default async function StructuresPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await searchParams;
  return <StructureAtlas />;
}
