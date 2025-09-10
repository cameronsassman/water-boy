'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible?: boolean;
  message?: string;
}

export default function LoadingScreen({ 
  isVisible = true, 
  message = "Loading..." 
}: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          {/* Water polo ball in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🏊‍♂️</span>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-xl font-semibold text-blue-900 mb-2">
          {message}
          <span className="inline-block w-8 text-left">{dots}</span>
        </div>
        
        {/* Subtitle */}
        <div className="text-sm text-blue-600">
          U14 Water Polo Tournament
        </div>
      </div>
    </div>
  );
}