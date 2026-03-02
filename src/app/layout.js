import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hutan Kita',
  description: 'Sistem Informasi Perhutanan Sosial',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
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
