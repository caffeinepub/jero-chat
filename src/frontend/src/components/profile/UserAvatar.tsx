import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface UserAvatarProps {
  photo?: ExternalBlob | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ photo, name, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  const getInitials = (name?: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const imageUrl = photo?.getDirectURL();

  return (
    <Avatar className={`${sizeClasses[size]} cyber-border-teal neon-glow-teal ${className}`}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name || 'User avatar'} />}
      <AvatarFallback className="bg-primary/20 text-primary">
        {initials || <User className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
}
