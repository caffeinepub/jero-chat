import { useEffect, useRef } from 'react';
import { useSetUserPresence } from './useQueries';
import { useInternetIdentity } from './useInternetIdentity';
import { useActor } from './useActor';

const HEARTBEAT_INTERVAL = 25000; // 25 seconds

export function usePresenceHeartbeat() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const setPresence = useSetUserPresence();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    // Only run if authenticated and actor is available
    if (!identity || !actor) {
      return;
    }

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      if (isActiveRef.current) {
        try {
          await setPresence.mutateAsync(true);
        } catch (error) {
          console.warn('Failed to send presence heartbeat:', error);
        }
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up periodic heartbeat
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        // Optionally mark as offline when tab is hidden
        setPresence.mutate(false);
      } else {
        isActiveRef.current = true;
        // Send heartbeat when tab becomes visible again
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark as offline on unmount
      if (actor && identity) {
        setPresence.mutate(false);
      }
    };
  }, [identity, actor]);
}
