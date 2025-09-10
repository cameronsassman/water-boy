'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navigationItems = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Rules', href: '/rules', icon: '📋' },
  { name: 'Sponsors', href: '/sponsors', icon: '🤝' },
  { name: 'Previous Scores', href: '/scores', icon: '📊' },
  { name: 'Teams', href: '/teams', icon: '🏊‍♂️' },
  { name: 'Pools', href: '/pools', icon: '🏆' },
  { name: 'Knockout Bracket', href: '/brackets', icon: '🥇' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Don't show navigation on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNavigating(false);
  }, [pathname]);

  // Handle navigation with loading state
  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      setIsNavigating(true);
      setIsMobileMenuOpen(false);
      // Use router.push instead of Link for better control
      router.push(href);
    }
  };

  return (
    <nav className="bg-blue-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">🏊‍♂️</span>
              <span className="text-white font-bold text-lg hidden sm:block">
                U14 Water Polo Tournament
              </span>
              <span className="text-white font-bold text-lg sm:hidden">
                U14 Tournament
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isNavigating}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-blue-100 hover:text-white p-2"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-800">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    disabled={isNavigating}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 disabled:opacity-50 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}