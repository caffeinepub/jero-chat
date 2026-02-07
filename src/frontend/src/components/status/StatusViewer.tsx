import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { StatusItem } from '../../backend';
import { useGetUserBasicInfo, useGetUserProfilePhoto, useDeleteStatusForAuthor } from '../../hooks/useQueries';
import UserAvatar from '../profile/UserAvatar';
import { useSwipeNavigation } from './useSwipeNavigation';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface StatusViewerProps {
  statusItems: StatusItem[];
  startIndex?: number;
  onClose: () => void;
  onDeleted?: (statusId: bigint) => void;
}

export default function StatusViewer({ statusItems, startIndex = 0, onClose, onDeleted }: StatusViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStatus = statusItems[currentIndex];
  const { data: userInfo } = useGetUserBasicInfo(currentStatus.author);
  const { data: profilePhoto } = useGetUserProfilePhoto(currentStatus.author);
  const { identity } = useInternetIdentity();
  const deleteStatusMutation = useDeleteStatusForAuthor();

  const name = userInfo?.[1] || 'Unknown User';

  // Check if current user is the author
  const isAuthor = identity && currentStatus.author.toString() === identity.getPrincipal().toString();

  const handleNext = () => {
    if (currentIndex < statusItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      handlePrevious();
    } else if (x > (2 * width) / 3) {
      handleNext();
    }
  };

  // Swipe navigation
  const { containerRef } = useSwipeNavigation({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, statusItems.length]);

  // Audio playback management
  useEffect(() => {
    // Stop and reset audio when changing status
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Attempt to play audio if present (user-gesture-safe)
    if (currentStatus.audioTrack && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked - user will need to manually play
      });
    }
  }, [currentIndex, currentStatus.audioTrack]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStatusMutation.mutateAsync({
        author: currentStatus.author,
        statusId: currentStatus.id,
      });

      toast.success('Status deleted', {
        description: 'Your status has been deleted successfully.',
      });

      setShowDeleteDialog(false);

      // Notify parent component
      if (onDeleted) {
        onDeleted(currentStatus.id);
      }

      // Navigate to next status or close if this was the last one
      if (statusItems.length > 1) {
        if (currentIndex < statusItems.length - 1) {
          // Stay at current index (next item will shift into this position)
        } else {
          // Was viewing last item, go to previous
          setCurrentIndex(currentIndex - 1);
        }
      } else {
        // This was the only status, close viewer
        onClose();
      }
    } catch (error: any) {
      toast.error('Failed to delete status', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const timeAgo = (timestamp: bigint) => {
    const now = Date.now();
    const diff = now - Number(timestamp) / 1_000_000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const renderMedia = () => {
    if (currentStatus.media.__kind__ === 'text') {
      return (
        <div className="flex h-full items-center justify-center px-8">
          <p className="neon-text-teal text-center text-3xl font-bold leading-relaxed">
            {currentStatus.media.text}
          </p>
        </div>
      );
    }

    if (currentStatus.media.__kind__ === 'photo') {
      return (
        <img
          src={currentStatus.media.photo.getDirectURL()}
          alt="Status"
          className="h-full w-full object-contain"
        />
      );
    }

    if (currentStatus.media.__kind__ === 'video') {
      return (
        <video
          src={currentStatus.media.video.getDirectURL()}
          controls
          autoPlay
          className="h-full w-full object-contain"
        />
      );
    }

    return null;
  };

  return (
    <>
      <div className="status-viewer-overlay fixed inset-0 z-50 flex flex-col bg-black">
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            <UserAvatar photo={profilePhoto} name={name} size="md" />
            <div>
              <h3 className="neon-text-teal font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{timeAgo(currentStatus.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <Button
                onClick={handleDeleteClick}
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/20"
                disabled={deleteStatusMutation.isPending}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="relative z-10 flex gap-1 px-4">
          {statusItems.map((_, index) => (
            <div
              key={index}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-full bg-white'
                    : index < currentIndex
                    ? 'w-full bg-white'
                    : 'w-0 bg-white'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Media Content */}
        <div
          ref={containerRef}
          onClick={handleTap}
          className="relative flex flex-1 cursor-pointer items-center justify-center overflow-hidden"
        >
          {renderMedia()}

          {/* Navigation Hints */}
          {currentIndex > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 transition-opacity hover:opacity-100">
              <ChevronLeft className="h-12 w-12 text-white" />
            </div>
          )}
          {currentIndex < statusItems.length - 1 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 transition-opacity hover:opacity-100">
              <ChevronRight className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {/* Audio Player */}
        {currentStatus.audioTrack && (
          <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-2">
            <audio
              ref={audioRef}
              src={currentStatus.audioTrack.getDirectURL()}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* Caption */}
        {currentStatus.caption && (
          <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-center text-white">{currentStatus.caption}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="cyber-border-teal neon-glow-teal bg-card/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="neon-text-teal">Delete this status?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your status will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteStatusMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteStatusMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
