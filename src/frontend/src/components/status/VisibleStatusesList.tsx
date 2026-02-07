import { useMemo } from 'react';
import type { StatusItem } from '../../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { useGetUserBasicInfo, useGetUserProfilePhoto } from '../../hooks/useQueries';
import UserAvatar from '../profile/UserAvatar';
import { ScrollArea } from '../ui/scroll-area';

interface VisibleStatusesListProps {
  statuses: StatusItem[];
  onStatusSelect: (authorStatuses: StatusItem[], index: number) => void;
}

interface StatusAuthorCardProps {
  author: Principal;
  statuses: StatusItem[];
  onSelect: () => void;
}

function StatusAuthorCard({ author, statuses, onSelect }: StatusAuthorCardProps) {
  const { data: userInfo } = useGetUserBasicInfo(author);
  const { data: profilePhoto } = useGetUserProfilePhoto(author);

  const name = userInfo?.[1] || 'Unknown User';
  const latestStatus = statuses[0];
  const statusCount = statuses.length;

  const getPreviewContent = () => {
    if (latestStatus.media.__kind__ === 'text') {
      return (
        <div className="flex h-16 items-center justify-center rounded-lg bg-accent/20 px-4">
          <p className="line-clamp-2 text-center text-sm text-accent">
            {latestStatus.media.text}
          </p>
        </div>
      );
    }

    if (latestStatus.media.__kind__ === 'photo') {
      return (
        <img
          src={latestStatus.media.photo.getDirectURL()}
          alt="Status preview"
          className="h-16 w-16 rounded-lg object-cover"
        />
      );
    }

    if (latestStatus.media.__kind__ === 'video') {
      return (
        <video
          src={latestStatus.media.video.getDirectURL()}
          className="h-16 w-16 rounded-lg object-cover"
        />
      );
    }

    return null;
  };

  const timeAgo = (timestamp: bigint) => {
    const now = Date.now();
    const diff = now - Number(timestamp) / 1_000_000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <button
      onClick={onSelect}
      className="cyber-border-teal neon-glow-teal flex w-full items-center gap-4 rounded-lg bg-card/50 p-4 text-left transition-all hover:bg-card/70"
    >
      <div className="relative">
        <UserAvatar photo={profilePhoto} name={name} size="lg" />
        {statusCount > 1 && (
          <div className="neon-glow-teal absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold">
            {statusCount}
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="neon-text-teal font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{timeAgo(latestStatus.timestamp)}</p>
      </div>
      <div>{getPreviewContent()}</div>
    </button>
  );
}

export default function VisibleStatusesList({ statuses, onStatusSelect }: VisibleStatusesListProps) {
  // Group statuses by author
  const groupedStatuses = useMemo(() => {
    const groups = new Map<string, StatusItem[]>();
    
    statuses.forEach((status) => {
      const authorKey = status.author.toString();
      if (!groups.has(authorKey)) {
        groups.set(authorKey, []);
      }
      groups.get(authorKey)!.push(status);
    });

    // Sort each author's statuses by timestamp (newest first)
    groups.forEach((authorStatuses) => {
      authorStatuses.sort((a, b) => Number(b.timestamp - a.timestamp));
    });

    return Array.from(groups.entries()).map(([_, authorStatuses]) => ({
      author: authorStatuses[0].author,
      statuses: authorStatuses,
    }));
  }, [statuses]);

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-3 p-4">
        {groupedStatuses.map(({ author, statuses }) => (
          <StatusAuthorCard
            key={author.toString()}
            author={author}
            statuses={statuses}
            onSelect={() => onStatusSelect(statuses, 0)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
