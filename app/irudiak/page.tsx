import type { Metadata } from 'next';
import { ImageLab } from '@/components/shell/ImageLab';

export const metadata: Metadata = { title: 'Irudi-laborategia: azterketako irudiak irakurtzen — EnbrioAtlas' };

export default function ImageLabPage() {
  return <ImageLab />;
}
