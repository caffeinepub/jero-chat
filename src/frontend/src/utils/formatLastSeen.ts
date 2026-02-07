import type { Time } from '../backend';

/**
 * Formats a last-seen timestamp into a human-readable English string.
 * Returns "Last seen HH:MM" format for recent times.
 */
export function formatLastSeen(lastSeen: Time | null): string {
  if (!lastSeen || lastSeen === BigInt(0)) {
    return 'Offline';
  }

  try {
    // Convert nanoseconds to milliseconds
    const lastSeenMs = Number(lastSeen / BigInt(1_000_000));
    const lastSeenDate = new Date(lastSeenMs);
    const now = new Date();

    // Check if the date is valid
    if (isNaN(lastSeenDate.getTime())) {
      return 'Offline';
    }

    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Just now (less than 1 minute)
    if (diffMinutes < 1) {
      return 'Last seen just now';
    }

    // Less than 1 hour ago
    if (diffMinutes < 60) {
      return `Last seen ${diffMinutes}m ago`;
    }

    // Less than 24 hours ago - show time
    if (diffHours < 24) {
      const hours = lastSeenDate.getHours().toString().padStart(2, '0');
      const minutes = lastSeenDate.getMinutes().toString().padStart(2, '0');
      return `Last seen ${hours}:${minutes}`;
    }

    // Less than 7 days ago
    if (diffDays < 7) {
      if (diffDays === 1) {
        return 'Last seen yesterday';
      }
      return `Last seen ${diffDays}d ago`;
    }

    // More than a week ago
    return 'Last seen a while ago';
  } catch (error) {
    console.error('Error formatting last seen:', error);
    return 'Offline';
  }
}
