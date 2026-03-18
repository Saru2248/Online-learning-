import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'EduFlow — Learn Without Limits',
  description:
    'Personalized online courses with AI-powered recommendations. Master new skills with expert instructors.',
  keywords: ['online learning', 'courses', 'EdTech', 'AI recommendations'],
  openGraph: {
    title: 'EduFlow — Learn Without Limits',
    description: 'Personalized online courses with AI-powered recommendations',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-surface-950 text-white min-h-screen">
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
