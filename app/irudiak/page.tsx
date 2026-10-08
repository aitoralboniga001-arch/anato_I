import type { Metadata } from 'next';
import { ImageLab } from '@/components/shell/ImageLab';

export const metadata: Metadata = { title: 'Irudi-laborategia: irudiak etiketarik gabe irakurtzen — EnbrioAtlas' };

export default function ImageLabPage() {
  return <ImageLab />;
}
