import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Image, Video, Type, Loader2, Music, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateStatus } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import type { MediaType } from '../../backend';
import { validateAudioFile, validateAudioBytes } from '../../utils/audioValidation';
import { fetchAudioFromUrl } from '../../utils/audioUrlFetch';

interface StatusComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MediaMode = 'photo' | 'video' | 'text' | null;
type AudioSourceMode = 'local' | 'online';

export default function StatusComposerDialog({ open, onOpenChange }: StatusComposerDialogProps) {
  const [mediaMode, setMediaMode] = useState<MediaMode>(null);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Audio state
  const [audioSourceMode, setAudioSourceMode] = useState<AudioSourceMode>('local');
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [fetchedAudioBytes, setFetchedAudioBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [fetchedAudioFilename, setFetchedAudioFilename] = useState<string | null>(null);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);

  const createStatusMutation = useCreateStatus();

  const handleReset = () => {
    setMediaMode(null);
    setCaption('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setAudioSourceMode('local');
    setSelectedAudio(null);
    setAudioPreviewUrl(null);
    setAudioUrl('');
    setFetchedAudioBytes(null);
    setFetchedAudioFilename(null);
    setIsFetchingAudio(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleModeSelect = (mode: MediaMode) => {
    setMediaMode(mode);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1GB limit)
    if (file.size > 1_073_741_824) {
      toast.error('File too large', {
        description: 'Maximum file size is 1 GB. Please choose a smaller file.',
      });
      return;
    }

    // Validate file type
    if (mediaMode === 'photo' && !file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file.',
      });
      return;
    }

    if (mediaMode === 'video' && !file.type.startsWith('video/')) {
      toast.error('Invalid file type', {
        description: 'Please select a video file.',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAudioFile(file);
    if (validationError) {
      toast.error('Invalid audio file', {
        description: validationError,
      });
      return;
    }

    setSelectedAudio(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const handleFetchAudioFromUrl = async () => {
    if (!audioUrl.trim()) {
      toast.error('URL required', {
        description: 'Please enter a direct audio file URL.',
      });
      return;
    }

    setIsFetchingAudio(true);
    try {
      const { bytes, filename, contentType } = await fetchAudioFromUrl(audioUrl);
      
      // Validate the fetched audio
      const validationError = validateAudioBytes(bytes, contentType);
      if (validationError) {
        toast.error('Invalid audio file', {
          description: validationError,
        });
        setIsFetchingAudio(false);
        return;
      }

      // Convert to Uint8Array<ArrayBuffer> for type compatibility
      const typedBytes = new Uint8Array(bytes.buffer.slice(0)) as Uint8Array<ArrayBuffer>;

      // Create preview URL from bytes
      const blob = new Blob([typedBytes], { type: contentType });
      const previewUrl = URL.createObjectURL(blob);

      setFetchedAudioBytes(typedBytes);
      setFetchedAudioFilename(filename);
      setAudioPreviewUrl(previewUrl);

      toast.success('Audio loaded', {
        description: `Successfully loaded ${filename}`,
      });
    } catch (error: any) {
      toast.error('Failed to fetch audio', {
        description: error.message || 'Please check the URL and try again.',
      });
    } finally {
      setIsFetchingAudio(false);
    }
  };

  const handleRemoveAudio = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setSelectedAudio(null);
    setAudioPreviewUrl(null);
    setAudioUrl('');
    setFetchedAudioBytes(null);
    setFetchedAudioFilename(null);
  };

  const handleAudioSourceModeChange = (mode: AudioSourceMode) => {
    // Clear current audio when switching modes
    handleRemoveAudio();
    setAudioSourceMode(mode);
  };

  const handleSubmit = async () => {
    if (!mediaMode) return;

    // Validate caption length
    if (caption.length > 160) {
      toast.error('Caption too long', {
        description: 'Maximum length is 160 characters.',
      });
      return;
    }

    try {
      let media: MediaType;

      if (mediaMode === 'text') {
        if (!caption.trim()) {
          toast.error('Text required', {
            description: 'Please enter some text for your status.',
          });
          return;
        }
        media = { __kind__: 'text', text: caption };
      } else {
        if (!selectedFile) {
          toast.error('File required', {
            description: `Please select a ${mediaMode} file.`,
          });
          return;
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        if (mediaMode === 'photo') {
          media = { __kind__: 'photo', photo: blob };
        } else {
          media = { __kind__: 'video', video: blob };
        }
      }

      // Handle optional audio track (from local file or fetched URL)
      let audioTrack: ExternalBlob | null = null;
      if (audioSourceMode === 'local' && selectedAudio) {
        const audioArrayBuffer = await selectedAudio.arrayBuffer();
        const audioUint8Array = new Uint8Array(audioArrayBuffer);
        audioTrack = ExternalBlob.fromBytes(audioUint8Array).withUploadProgress((percentage) => {
          // Audio upload progress could be tracked separately if needed
        });
      } else if (audioSourceMode === 'online' && fetchedAudioBytes) {
        audioTrack = ExternalBlob.fromBytes(fetchedAudioBytes).withUploadProgress((percentage) => {
          // Audio upload progress could be tracked separately if needed
        });
      }

      await createStatusMutation.mutateAsync({ media, caption, audioTrack });

      toast.success('Status created', {
        description: 'Your status has been posted successfully.',
      });

      handleClose();
    } catch (error: any) {
      toast.error('Failed to create status', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const isSubmitting = createStatusMutation.isPending;
  const canSubmit = mediaMode === 'text' ? caption.trim().length > 0 : !!selectedFile;
  const hasAudio = (audioSourceMode === 'local' && selectedAudio) || (audioSourceMode === 'online' && fetchedAudioBytes);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="cyber-border-teal neon-glow-teal max-w-md bg-card/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="neon-text-teal font-display text-xl">Create Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!mediaMode ? (
            <div className="space-y-3">
              <Label>Choose status type</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleModeSelect('photo')}
                  className="cyber-border-teal neon-glow-teal flex flex-col items-center gap-2 rounded-lg bg-primary/10 p-4 transition-all hover:bg-primary/20"
                >
                  <Image className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">Photo</span>
                </button>
                <button
                  onClick={() => handleModeSelect('video')}
                  className="cyber-border-purple neon-glow-purple flex flex-col items-center gap-2 rounded-lg bg-secondary/10 p-4 transition-all hover:bg-secondary/20"
                >
                  <Video className="h-8 w-8 text-secondary" />
                  <span className="text-sm font-medium">Video</span>
                </button>
                <button
                  onClick={() => handleModeSelect('text')}
                  className="cyber-border-teal neon-glow-teal flex flex-col items-center gap-2 rounded-lg bg-accent/10 p-4 transition-all hover:bg-accent/20"
                >
                  <Type className="h-8 w-8 text-accent" />
                  <span className="text-sm font-medium">Text</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label>
                  {mediaMode === 'photo' && 'Photo Status'}
                  {mediaMode === 'video' && 'Video Status'}
                  {mediaMode === 'text' && 'Text Status'}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModeSelect(null)}
                  disabled={isSubmitting}
                >
                  Change
                </Button>
              </div>

              {mediaMode !== 'text' && (
                <div>
                  <input
                    type="file"
                    accept={mediaMode === 'photo' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-file"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="media-file">
                    <div className="cyber-border-teal neon-glow-teal flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg bg-primary/5 transition-all hover:bg-primary/10">
                      {previewUrl ? (
                        mediaMode === 'photo' ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-[300px] rounded-lg"
                          />
                        ) : (
                          <video
                            src={previewUrl}
                            controls
                            className="max-h-[300px] rounded-lg"
                          />
                        )
                      ) : (
                        <>
                          {mediaMode === 'photo' ? (
                            <Image className="mb-2 h-12 w-12 text-primary" />
                          ) : (
                            <Video className="mb-2 h-12 w-12 text-secondary" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            Click to select {mediaMode}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}

              <div>
                <Label htmlFor="caption">
                  {mediaMode === 'text' ? 'Text' : 'Caption'} ({caption.length}/160)
                </Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    mediaMode === 'text'
                      ? 'What\'s on your mind?'
                      : 'Add a caption...'
                  }
                  maxLength={160}
                  rows={4}
                  disabled={isSubmitting}
                  className="cyber-border-teal mt-2 resize-none bg-background/50"
                />
              </div>

              {/* Optional Audio Attachment */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Add Music (Optional)
                </Label>

                {/* Audio Source Mode Toggle */}
                {!hasAudio && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={audioSourceMode === 'local' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAudioSourceModeChange('local')}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Local
                    </Button>
                    <Button
                      type="button"
                      variant={audioSourceMode === 'online' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAudioSourceModeChange('online')}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Online
                    </Button>
                  </div>
                )}

                {/* Local Audio File Picker */}
                {audioSourceMode === 'local' && !hasAudio && (
                  <>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className="hidden"
                      id="audio-file"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="audio-file">
                      <div className="cyber-border-teal neon-glow-teal flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary/5 p-3 transition-all hover:bg-primary/10">
                        <Music className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Click to select audio file
                        </span>
                      </div>
                    </label>
                  </>
                )}

                {/* Online Audio URL Input */}
                {audioSourceMode === 'online' && !hasAudio && (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/audio.mp3"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      disabled={isSubmitting || isFetchingAudio}
                      className="cyber-border-teal bg-background/50"
                    />
                    <Button
                      type="button"
                      onClick={handleFetchAudioFromUrl}
                      disabled={!audioUrl.trim() || isSubmitting || isFetchingAudio}
                      className="neon-glow-teal w-full bg-primary/20 hover:bg-primary/30"
                    >
                      {isFetchingAudio ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Fetch Audio
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Audio Preview (for both local and online) */}
                {hasAudio && (
                  <div className="cyber-border-teal neon-glow-teal space-y-2 rounded-lg bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary truncate">
                        {audioSourceMode === 'local' && selectedAudio
                          ? selectedAudio.name
                          : fetchedAudioFilename || 'audio-track.mp3'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveAudio}
                        disabled={isSubmitting}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {audioPreviewUrl && (
                      <audio
                        src={audioPreviewUrl}
                        controls
                        className="w-full"
                      />
                    )}
                  </div>
                )}
              </div>

              {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="neon-glow-teal h-2 overflow-hidden rounded-full bg-primary/20">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="neon-glow-teal flex-1 bg-primary/20 hover:bg-primary/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Status'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
