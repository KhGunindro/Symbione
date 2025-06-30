import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@/components/providers/redux-provider';
import EmotionUpdater from '@/components/providers/emotion-updater';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Symbione - Emotionally Intelligent News',
  description: 'Explore the emotional landscape of global news through interactive 3D visualizations and AI-powered insights.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          <EmotionUpdater />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}