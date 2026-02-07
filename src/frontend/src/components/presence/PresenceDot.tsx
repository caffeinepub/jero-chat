interface PresenceDotProps {
  isOnline: boolean;
  className?: string;
}

/**
 * Reusable presence indicator dot component.
 * Always visible: green when online, grey when offline.
 */
export default function PresenceDot({ isOnline, className = '' }: PresenceDotProps) {
  return (
    <div
      className={`h-3 w-3 rounded-full border-2 border-background ${
        isOnline ? 'bg-green-400' : 'bg-gray-500'
      } ${className}`}
    />
  );
}
