'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navigationItems = [
  { name: 'Home', href: '/' },
  // { name: 'Rules', href: '/rules' },
  // { name: 'Sponsors', href: '/sponsors' },
  { name: 'Fixtures', href: '/scores' },
  { name: 'Teams', href: '/teams' },
  { name: 'Pools', href: '/pools' },
  // { name: 'Knockout Bracket', href: '/brackets' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNavigating(false);
  }, [pathname]);

  // Don't show navigation on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Handle navigation with loading state
  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      setIsNavigating(true);
      setIsMobileMenuOpen(false);
      router.push(href);
    }
  };

  return (
    <nav className="bg-blue-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
            >
              <span className="text-white font-bold whitespace-nowrap">
                {/* Different text sizes for different devices */}
                <span className="text-sm sm:text-base md:text-lg lg:text-xl">
                  SACS Water Polo
                </span>
                <span className="hidden sm:inline text-sm sm:text-base md:text-lg lg:text-xl">
                  {' '}Tournament
                </span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation - Full items on large screens */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isNavigating}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-inner'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Tablet Navigation - Compact items on medium screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const shortName = 
                item.name === 'Previous Scores' ? 'Scores' :
                item.name === 'Knockout Bracket' ? 'Bracket' :
                item.name;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isNavigating}
                  className={`px-2 py-2 rounded-md text-xs font-medium transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-inner'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                  title={item.name}
                >
                  {shortName}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button - Show on small screens only */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-blue-100 hover:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded transition-colors"
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
          <div className="md:hidden border-t border-blue-700">
            <div className="px-2 pt-2 pb-4 space-y-1 bg-blue-800">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    disabled={isNavigating}
                    className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      isActive
                        ? 'bg-blue-700 text-white shadow-inner'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
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