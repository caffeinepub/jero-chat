import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Loader2, Fingerprint, Smartphone, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginScreen() {
  const { login, loginStatus, identity, isLoginError } = useInternetIdentity();
  const navigate = useNavigate();

  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (isLoginError) {
      toast.error('Login failed', {
        description: 'Please try again or check your Internet Identity.',
      });
    }
  }, [isLoginError]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-10">
        {/* Logo/Title */}
        <div className="text-center">
          <img
            src="/assets/generated/jero-chat-logo.dim_512x512.png"
            alt="Jero Chat Logo"
            className="mx-auto mb-8 h-56 w-auto drop-shadow-[0_0_25px_rgba(0,255,255,0.5)]"
          />
          <h1 className="neon-text-teal font-display text-6xl font-bold tracking-wider">
            Jero Chat
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Secure messaging on the Internet Computer
          </p>
        </div>

        {/* Login Card */}
        <div className="cyber-border-teal neon-glow-teal rounded-3xl bg-card/60 p-10 backdrop-blur-md shadow-2xl">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Get Started</h2>
              <p className="text-base text-muted-foreground">
                Sign in securely with Internet Identity
              </p>
            </div>

            {/* Primary Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="login-primary-cta w-full py-8 text-xl font-bold shadow-neon-teal-strong hover:shadow-neon-teal-stronger transition-all duration-300"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-3 h-6 w-6" />
                  Login with Internet Identity
                </>
              )}
            </Button>

            {/* Explanation Section */}
            <div className="space-y-4 rounded-2xl bg-muted/30 p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                How Login Works
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Fingerprint className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong className="text-foreground">Passkeys & Biometrics:</strong> Use your device's fingerprint, Face ID, or security key
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong className="text-foreground">Device Authentication:</strong> Your phone or computer's built-in security
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong className="text-foreground">No Passwords:</strong> More secure than traditional login methods
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground italic">
                  Note: Phone numbers are only used as profile contact info, not for authentication.
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/70">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
