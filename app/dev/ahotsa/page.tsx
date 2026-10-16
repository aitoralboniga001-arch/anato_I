import { notFound } from 'next/navigation';
import { VoiceLab } from './VoiceLab';

/** Dev-only: the browser's voices reading topic 10 class lines, raw and respelled (the one listening check). */
export default function VoicePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <VoiceLab />;
}
