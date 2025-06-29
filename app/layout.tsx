import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@/components/providers/redux-provider';
import EmotionUpdater from '@/components/providers/emotion-updater';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Symbione - Emotionally Intelligent News',
  description: 'Explore the emotional landscape of global news through interactive 3D visualizations and AI-powered insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <EmotionUpdater />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}