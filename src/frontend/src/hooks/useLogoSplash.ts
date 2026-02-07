import { useState, useEffect } from 'react';

const SPLASH_SESSION_KEY = 'jero-chat-splash-played';
const MINIMUM_DURATION = 1800; // 1.8 seconds to match animation

interface UseLogoSplashOptions {
  isInitializing: boolean;
}

export function useLogoSplash({ isInitializing }: UseLogoSplashOptions) {
  const [shouldShowSplash, setShouldShowSplash] = useState(() => {
    // Check if splash has already been played this session
    return !sessionStorage.getItem(SPLASH_SESSION_KEY);
  });

  const [animationComplete, setAnimationComplete] = useState(false);
  const [minimumDurationElapsed, setMinimumDurationElapsed] = useState(false);

  useEffect(() => {
    if (!shouldShowSplash) return;

    // Track minimum duration
    const timer = setTimeout(() => {
      setMinimumDurationElapsed(true);
    }, MINIMUM_DURATION);

    return () => clearTimeout(timer);
  }, [shouldShowSplash]);

  const handleSplashComplete = () => {
    setAnimationComplete(true);
  };

  // Determine if splash should remain visible
  const splashVisible =
    shouldShowSplash && (!animationComplete || !minimumDurationElapsed || isInitializing);

  // Once all conditions are met, mark splash as played and hide it
  useEffect(() => {
    if (shouldShowSplash && animationComplete && minimumDurationElapsed && !isInitializing) {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
      setShouldShowSplash(false);
    }
  }, [shouldShowSplash, animationComplete, minimumDurationElapsed, isInitializing]);

  return {
    splashVisible,
    handleSplashComplete,
  };
}
