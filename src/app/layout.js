import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hutan Kita',
  description: 'Sistem Informasi Perhutanan Sosial',
  icons: {
    icon: '/images/logo/Logo_Malut.svg',
    apple: '/images/logo/Logo_Malut.svg',
  },
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
