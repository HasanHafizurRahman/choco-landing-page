import type { Metadata, Viewport } from 'next';
import { Anek_Bangla, Caprasimo, Doto } from 'next/font/google';
import './globals.css';

// Display: soft, chunky letters that look molded. Body: Anek Bangla covers English and Bangla.
const display = Caprasimo({ weight: '400', subsets: ['latin'], variable: '--font-caprasimo', display: 'swap' });
const body = Anek_Bangla({ subsets: ['latin', 'bengali'], axes: ['wdth'], variable: '--font-anek', display: 'swap' });
// Dot-matrix, like the inkjet best-before print on a wrapper
const inkjet = Doto({ weight: '800', subsets: ['latin'], variable: '--font-doto', display: 'swap' });

export const metadata: Metadata = {
  title: 'moyra · Chocolate, always.',
  description:
    'Imported chocolate from the brands you love, stored cool and delivered cool anywhere in Bangladesh. In season: Rajshahi mangoes in summer and gift boxes for Falgun and Valentine’s.',
};

export const viewport: Viewport = {
  themeColor: '#1C110B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${inkjet.variable}`}>
      <body>{children}</body>
    </html>
  );
}
