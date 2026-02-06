import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Copy, Download, Check, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';

export default function DownloadInstallScreen() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { isInstallable, promptInstall } = usePwaInstallPrompt();

  const appUrl = window.location.origin;

  const handleBackClick = () => {
    navigate({ to: '/' });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!', {
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link', {
        description: 'Please copy the URL manually from your browser.',
        duration: 3000,
      });
    }
  };

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result.outcome === 'accepted') {
      toast.success('App installed successfully!', {
        duration: 3000,
      });
    } else if (result.outcome === 'dismissed') {
      toast.info('Installation cancelled', {
        duration: 2000,
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
          aria-label="Back to Chat"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
          Jero Chat
        </h1>
        <div className="w-8" />
      </header>

      {/* Download/Install Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-md space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
              <Download className="h-12 w-12 text-primary" />
            </div>
            <h2 className="neon-text-teal mb-2 font-display text-3xl font-bold">
              Install Jero Chat
            </h2>
            <p className="text-muted-foreground">
              Access the app anytime from your home screen
            </p>
          </div>

          {/* App Link Section */}
          <div className="cyber-border-teal space-y-3 rounded-2xl bg-[#0f1419]/80 p-6 backdrop-blur-sm">
            <h3 className="font-display text-lg font-semibold text-primary">
              App Link
            </h3>
            <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3">
              <code className="flex-1 overflow-x-auto text-sm text-foreground">
                {appUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 rounded-lg bg-primary/20 p-2 transition-all hover:bg-primary/30 hover:shadow-neon-teal"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <Copy className="h-5 w-5 text-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Install Button (PWA) */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="cyber-border-teal neon-glow-teal w-full rounded-2xl bg-primary/20 px-8 py-4 font-display text-xl font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/30 hover:shadow-neon-teal"
            >
              <div className="flex items-center justify-center gap-3">
                <Smartphone className="h-6 w-6" />
                Install App
              </div>
            </button>
          )}

          {/* Manual Install Instructions */}
          <div className="space-y-6">
            <div className="cyber-border-purple rounded-2xl bg-[#0f1419]/80 p-6 backdrop-blur-sm">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-secondary">
                <Smartphone className="h-5 w-5" />
                Android (Chrome / Edge)
              </h3>
              <ol className="space-y-3 text-sm text-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">1.</span>
                  <span>Open this page in Chrome or Edge browser</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">2.</span>
                  <span>Tap the menu icon (three dots) in the top right</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">3.</span>
                  <span>Select "Add to Home screen" or "Install app"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">4.</span>
                  <span>Confirm and the app will appear on your home screen</span>
                </li>
              </ol>
            </div>

            <div className="cyber-border-purple rounded-2xl bg-[#0f1419]/80 p-6 backdrop-blur-sm">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-secondary">
                <Smartphone className="h-5 w-5" />
                iOS (Safari)
              </h3>
              <ol className="space-y-3 text-sm text-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">1.</span>
                  <span>Open this page in Safari browser</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">2.</span>
                  <span>Tap the Share button (square with arrow pointing up)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">3.</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-primary">4.</span>
                  <span>Tap "Add" and the app will appear on your home screen</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Info Note */}
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              This is a web app that works on all devices. No app store download required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
