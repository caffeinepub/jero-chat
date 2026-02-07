import { formatLastSeen } from '../../utils/formatLastSeen';
import type { Time } from '../../backend';

interface PresenceStatusTextProps {
  isOnline: boolean;
  lastSeen: Time | null;
  isLoading?: boolean;
}

/**
 * Reusable presence status text component.
 * Displays: "Online", "Last seen HH:MM", "Offline", or "Status unavailable".
 */
export default function PresenceStatusText({ isOnline, lastSeen, isLoading }: PresenceStatusTextProps) {
  if (isLoading) {
    return <span className="text-muted-foreground">Status unavailable</span>;
  }

  if (isOnline) {
    return <span className="text-green-400">Online</span>;
  }

  const lastSeenText = formatLastSeen(lastSeen);
  return <span className="text-muted-foreground">{lastSeenText}</span>;
}
