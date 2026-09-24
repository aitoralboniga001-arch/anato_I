import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap', axes: ['opsz'] });

export const metadata: Metadata = {
  title: 'EnbrioAtlas — Garapenaren lehen lau asteak',
  description: 'Giza enbriologiaren lehen lau asteak ikasteko simulagailu bisual eta interaktiboa, euskaraz.',
};

export const viewport: Viewport = {
  themeColor: '#060a13',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="eu" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
