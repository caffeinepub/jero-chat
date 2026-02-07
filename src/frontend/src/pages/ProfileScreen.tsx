import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetCallerProfilePhoto } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Copy, Check, User, Phone, Shield, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { validatePhoneNumber } from '../utils/phoneNumber';
import UserAvatar from '../components/profile/UserAvatar';
import type { UserProfile } from '../backend';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isError } = useGetCallerUserProfile();
  const { data: profilePhoto } = useGetCallerProfilePhoto();
  const saveMutation = useSaveCallerUserProfile();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const principalId = identity?.getPrincipal().toString() || '';

  // Initialize form with existing profile data
  if (userProfile && !hasInitialized) {
    setName(userProfile.name);
    setPhoneNumber(userProfile.phoneNumber || '');
    setHasInitialized(true);
  }

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard', {
        description: 'Please try again or copy manually',
      });
    }
  };

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError('');
  };

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      toast.error('Name is required', {
        description: 'Please enter your name',
      });
      return;
    }

    // Validate phone number if provided
    if (phoneNumber.trim()) {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        return;
      }
    }

    const profile: UserProfile = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
    };

    try {
      await saveMutation.mutateAsync(profile);
      toast.success('Profile saved successfully', {
        description: 'Your profile has been updated',
      });
    } catch (error: any) {
      toast.error('Failed to save profile', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleManagePhoto = () => {
    navigate({ to: '/profile/photo' });
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="rounded-lg p-2 transition-all hover:bg-primary/20"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </button>
            <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
              Profile
            </h1>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="rounded-lg p-2 transition-all hover:bg-primary/20"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </button>
            <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
              Profile
            </h1>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
              <CardDescription>
                Unable to load your profile. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBack} variant="outline" className="w-full">
                Back to Chat
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isNewProfile = userProfile === null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 transition-all hover:bg-primary/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
            Profile
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto p-4">
        <div className="w-full max-w-2xl space-y-6 py-6">
          {/* New Profile Notice */}
          {isNewProfile && (
            <Card className="cyber-border-teal neon-glow-teal bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-3">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Create Your Profile</CardTitle>
                    <CardDescription>
                      Set up your profile to start using Jero Chat
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Profile Photo Card */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <CardTitle>Profile Photo</CardTitle>
              </div>
              <CardDescription>
                {profilePhoto ? 'Your current profile photo' : 'Add a profile photo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <UserAvatar
                photo={profilePhoto}
                name={userProfile?.name}
                size="lg"
                className="h-24 w-24 text-2xl"
              />
              <Button
                onClick={handleManagePhoto}
                variant="outline"
                className="w-full"
              >
                <Camera className="mr-2 h-4 w-4" />
                {profilePhoto ? 'Change Profile Photo' : 'Add Profile Photo'}
              </Button>
            </CardContent>
          </Card>

          {/* Principal ID Card */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Your Principal ID</CardTitle>
              </div>
              <CardDescription>
                Your unique identifier on the Internet Computer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={principalId}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyPrincipal}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this ID with others so they can add you as a contact
              </p>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your name and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saveMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be visible to your contacts
                </p>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number (Optional)
                  </div>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={saveMutation.isPending}
                  className={phoneError ? 'border-destructive' : ''}
                />
                {phoneError ? (
                  <p className="text-xs text-destructive">{phoneError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    International format (E.164): start with + followed by country code and number
                  </p>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
