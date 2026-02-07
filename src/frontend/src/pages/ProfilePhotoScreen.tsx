import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Upload, Trash2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import { useGetCallerProfilePhoto, useSetCallerProfilePhoto } from '../hooks/useQueries';
import UserAvatar from '../components/profile/UserAvatar';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { validateImageResolution, formatFileSize } from '../utils/imageValidation';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProfilePhotoScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: currentPhoto, isLoading: photoLoading } = useGetCallerProfilePhoto();
  const setPhotoMutation = useSetCallerProfilePhoto();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleBack = () => {
    navigate({ to: '/profile' });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please select a JPEG, PNG, or WebP image',
      });
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (1GB limit)
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: `Maximum file size is 1 GB. Your file is ${formatFileSize(file.size)}.`,
      });
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate image resolution (100 megapixel limit)
    const resolutionCheck = await validateImageResolution(file);
    if (!resolutionCheck.valid) {
      toast.error('Image exceeds the 100 megapixel limit', {
        description: resolutionCheck.error || 'Please select a smaller resolution image',
      });
      // Clear any pending selection/preview
      setSelectedFile(null);
      setPreviewUrl(null);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) {
      toast.error('No file selected', {
        description: 'Please select an image to upload',
      });
      return;
    }

    try {
      // Convert file to Uint8Array
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with upload progress tracking
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await setPhotoMutation.mutateAsync(blob);

      toast.success('Profile photo saved', {
        description: 'Your profile photo has been updated',
      });

      // Clear selection and preview
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error('Failed to save photo', {
        description: error.message || 'Please try again',
      });
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await setPhotoMutation.mutateAsync(null);
      toast.success('Profile photo removed', {
        description: 'Your profile photo has been removed',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      toast.error('Failed to remove photo', {
        description: error.message || 'Please try again',
      });
    }
  };

  const isUploading = setPhotoMutation.isPending;
  const hasCurrentPhoto = !!currentPhoto;
  const hasPreview = !!previewUrl;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 transition-all hover:bg-primary/20"
            aria-label="Back"
            disabled={isUploading}
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
            Profile Photo
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto p-4">
        <div className="w-full max-w-2xl space-y-6 py-6">
          {/* Current Photo Preview */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <CardTitle>Your Profile Photo</CardTitle>
              </div>
              <CardDescription>
                {hasPreview
                  ? 'Preview of your new photo'
                  : hasCurrentPhoto
                  ? 'Your current profile photo'
                  : 'No profile photo set'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              {/* Avatar Display */}
              <div className="relative">
                {photoLoading ? (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-primary/30">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                  </div>
                ) : hasPreview ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-32 w-32 rounded-full border-2 border-primary object-cover neon-glow-teal"
                  />
                ) : (
                  <UserAvatar
                    photo={currentPhoto}
                    name={userProfile?.name}
                    size="lg"
                    className="h-32 w-32 text-2xl"
                  />
                )}
              </div>

              {/* File Input (Hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              {/* Action Buttons */}
              <div className="flex w-full flex-col gap-3">
                {/* Upload/Select Button */}
                <Button
                  onClick={handleUploadClick}
                  variant="outline"
                  className="w-full"
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {hasPreview ? 'Choose Different Photo' : 'Choose Photo'}
                </Button>

                {/* Save Button (only show when file selected) */}
                {hasPreview && (
                  <Button
                    onClick={handleSavePhoto}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Saving...'}
                      </>
                    ) : (
                      'Save Photo'
                    )}
                  </Button>
                )}

                {/* Remove Button (only show when current photo exists and no preview) */}
                {hasCurrentPhoto && !hasPreview && (
                  <Button
                    onClick={handleRemovePhoto}
                    variant="destructive"
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Photo
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <div className="w-full space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Photo Requirements:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Supported formats: JPEG, PNG, WebP</li>
                  <li>• Maximum resolution: 100 megapixels</li>
                  <li>• Maximum file size: 1 GB</li>
                  <li>• Square images work best</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <Button
            onClick={handleBack}
            variant="ghost"
            className="w-full"
            disabled={isUploading}
          >
            Back to Profile
          </Button>
        </div>
      </main>
    </div>
  );
}
