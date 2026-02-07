import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Copy, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHelpScreen() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();
  const [copied, setCopied] = useState(false);

  const principalId = identity?.getPrincipal().toString() || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleBack = () => {
    navigate({ to: '/' });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 transition-all hover:bg-primary/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
            Admin Help
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Admin Status Card */}
          <Card className="cyber-border-teal neon-glow-teal bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20" />
                ) : isAdmin ? (
                  <div className="rounded-full bg-primary/20 p-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                ) : (
                  <div className="rounded-full bg-muted/20 p-3">
                    <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle>
                    {isLoading ? 'Checking status...' : isAdmin ? 'Admin Access' : 'User Access'}
                  </CardTitle>
                  <CardDescription>
                    {isLoading
                      ? 'Please wait...'
                      : isAdmin
                      ? 'You have administrator privileges'
                      : 'You are logged in, but this account is not an admin'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* How Admin Login Works */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>How Admin Login Works</CardTitle>
              <CardDescription>Understanding admin access in Jero Chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Internet Identity Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Admins log in using Internet Identity, the same secure authentication system used
                  by all users. There is no separate admin login page.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">What is an Admin ID?</h3>
                <p className="text-sm text-muted-foreground">
                  The "admin id" is your principal ID (shown below). Admin access is granted by the
                  app owner to specific principals. If your principal has been granted admin
                  privileges, you automatically have admin access when logged in.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Getting Admin Access</h3>
                <p className="text-sm text-muted-foreground">
                  To become an admin, the app owner must grant admin privileges to your principal
                  ID. Share your principal ID (below) with the app owner to request admin access.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Principal ID */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Principal ID</CardTitle>
              <CardDescription>
                This is your unique identifier on the Internet Computer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Principal ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="principal"
                    value={principalId}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this ID with the app owner to request admin access
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button onClick={handleBack} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
