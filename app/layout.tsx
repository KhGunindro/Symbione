import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import ReduxProvider with no SSR to prevent redux-persist issues
const ReduxProvider = dynamic(() => import('@/components/providers/redux-provider'), {
  ssr: false,
});

// Dynamically import EmotionUpdater with no SSR
const EmotionUpdater = dynamic(() => import('@/components/providers/emotion-updater'), {
  ssr: false,
});

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