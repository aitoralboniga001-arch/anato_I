import { notFound } from 'next/navigation';
import { Frames } from './Frames';

/** Dev-only contact sheet: every view of a topic at each step's complete frame (scene review). */
export default function FramesPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Frames />;
}
