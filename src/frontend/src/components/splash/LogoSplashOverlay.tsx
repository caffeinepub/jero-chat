import React, { useEffect, useState } from 'react';

interface LogoSplashOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export default function LogoSplashOverlay({ visible, onComplete }: LogoSplashOverlayProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    if (!visible) return;

    // Phase 1: Enter (fade/scale in with glow) - 800ms
    const enterTimer = setTimeout(() => {
      setAnimationPhase('hold');
    }, 800);

    // Phase 2: Hold - 400ms
    const holdTimer = setTimeout(() => {
      setAnimationPhase('exit');
    }, 1200);

    // Phase 3: Exit (fade out) - 600ms
    const exitTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background splash-overlay">
      <div
        className={`splash-logo-container ${animationPhase === 'enter' ? 'splash-enter' : ''} ${
          animationPhase === 'hold' ? 'splash-hold' : ''
        } ${animationPhase === 'exit' ? 'splash-exit' : ''}`}
      >
        <img
          src="/assets/generated/jero-chat-logo.dim_512x512.png"
          alt="Jero Chat"
          className="w-64 h-64 object-contain"
        />
      </div>
    </div>
  );
}
