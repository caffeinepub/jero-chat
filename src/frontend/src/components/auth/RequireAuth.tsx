import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/login' });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  return <>{children}</>;
}
