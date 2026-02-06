import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Star, Sparkles, Palette, Video, Cloud } from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumScreen() {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    toast.info('Upgrade flow not implemented yet', {
      description: 'This is a placeholder for the premium upgrade feature.',
      duration: 3000,
    });
  };

  const handleBackClick = () => {
    navigate({ to: '/' });
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

      {/* Premium Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-md space-y-8">
          {/* Premium Badge Hero */}
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <img
                src="/assets/generated/premium-badge.dim_512x512.png"
                alt="Premium Badge"
                className="h-40 w-40 animate-pulse-glow"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="cyber-border-purple neon-glow-purple rounded-3xl bg-secondary/20 px-8 py-6 backdrop-blur-sm">
                  <h2 className="neon-text-purple text-center font-display text-2xl font-bold">
                    PREMIUM
                    <br />
                    USER
                  </h2>
                  <Star className="mx-auto mt-2 h-8 w-8 text-secondary" />
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-lg text-foreground">Exclusive Stickers & Emojis</p>
            </div>
            
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-lg text-foreground">Ad-Free Experience</p>
            </div>
            
            <div className="flex items-start gap-3">
              <Palette className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-lg text-foreground">Customizable Themes</p>
            </div>
            
            <div className="flex items-start gap-3">
              <Video className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-lg text-foreground">HD Video Calls</p>
            </div>
            
            <div className="flex items-start gap-3">
              <Cloud className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-lg text-foreground">Cloud Backup</p>
            </div>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={handleUpgradeClick}
            className="cyber-border-teal neon-glow-teal w-full rounded-2xl bg-primary/20 px-8 py-4 font-display text-xl font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/30 hover:shadow-neon-teal"
          >
            UPGRADE NOW
          </button>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground">
            Monthly subscription. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
