// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '../components/layout/navigation';
import { AuthProvider } from '@/context/auth-context';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SACS Water Polo Tournament',
  description: 'U14 Water Polo Tournament Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>
          <Navigation />
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}