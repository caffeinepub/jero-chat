import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return { outcome: 'unavailable' as const };
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      setInstallPrompt(null);
      setIsInstallable(false);
      return { outcome: choiceResult.outcome };
    } catch (error) {
      console.error('Install prompt error:', error);
      return { outcome: 'error' as const };
    }
  };

  return {
    isInstallable,
    promptInstall,
  };
}
