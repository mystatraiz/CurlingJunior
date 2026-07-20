import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';

export const metadata: Metadata = {
  title: {
    default: 'Collectif Junior France – Curling',
    template: '%s · CJF Curling',
  },
  description:
    'Suivi des performances des joueurs du Collectif Junior France de Curling — réservé aux entraîneurs.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CJF Curling',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a121d' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
