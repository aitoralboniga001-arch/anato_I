import { redirect } from 'next/navigation';
import { ROOM_WEEKS } from '@/components/shell/eratorriak/roomWeeks';

export default function RoomsPage() {
  redirect(`/ikasgela/${ROOM_WEEKS[0]}`);
}
