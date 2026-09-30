import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Kimu } from '@/components/kimu/Kimu';

const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'EnbrioAtlas — Giza garapena, zelulaz zelula',
  description: 'Giza enbriologia ikasteko simulagailu bisual eta interaktiboa, euskaraz: ernalkuntzatik enbrioi eta fetuaren ezaugarri nagusietara.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
};

// Runs before first paint so the opening sequence never flashes when it was already seen this session.
const introFlag = `try{if(sessionStorage.getItem('enbrioatlas:intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='seen'}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="eu" className={`${sans.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introFlag }} />
      </head>
      <body>
        {children}
        <Kimu />
      </body>
    </html>
  );
}
