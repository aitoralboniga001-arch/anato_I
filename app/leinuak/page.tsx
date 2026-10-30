import { permanentRedirect } from 'next/navigation';

/** The page was renamed from "Leinuak" to "Eratorriak": old links and bookmarks land on the new one. */
export default function OldLineagePage() {
  permanentRedirect('/eratorriak');
}
