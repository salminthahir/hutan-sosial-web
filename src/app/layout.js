import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Perhutanan Sosial',
  description: 'Sistem Informasi Perhutanan Sosial',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/logo/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/logo/favicon-192.png" sizes="192x192" />
      </head>
      <body className={inter.className}>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
