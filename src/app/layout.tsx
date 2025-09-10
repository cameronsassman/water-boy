import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/layout/navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'U14 Water Polo Tournament',
  description: 'Under-14 Water Polo Tournament - Pools, Brackets, and Results',
  keywords: 'water polo, U14, tournament, schools, sport',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">U14 Water Polo Tournament 2025</h3>
              <p className="text-gray-300 text-sm">
                Bringing together young athletes from schools across the region
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Tournament Management System • Powered by Next.js
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}