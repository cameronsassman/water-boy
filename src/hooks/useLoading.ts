'use client';

import { useState } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [message, setMessage] = useState('Loading...');

  const startLoading = (loadingMessage?: string) => {
    if (loadingMessage) {
      setMessage(loadingMessage);
    }
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingMessage = (newMessage: string) => {
    setMessage(newMessage);
  };

  return {
    isLoading,
    message,
    startLoading,
    stopLoading,
    setLoadingMessage,
  };
}