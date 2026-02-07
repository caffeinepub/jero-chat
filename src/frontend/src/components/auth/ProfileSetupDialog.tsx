import { useState } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validatePhoneNumber } from '../../utils/phoneNumber';

interface ProfileSetupDialogProps {
  open: boolean;
}

export default function ProfileSetupDialog({ open }: ProfileSetupDialogProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
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

    try {
      const profile = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      };
      await saveProfile.mutateAsync(profile);
      toast.success('Profile created successfully!');
    } catch (error: any) {
      toast.error('Failed to create profile', {
        description: error.message || 'Please try again.',
      });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Jero Chat!</DialogTitle>
          <DialogDescription>
            Let's set up your profile. What should we call you?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              disabled={saveProfile.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPhoneError('');
              }}
              placeholder="+1234567890"
              disabled={saveProfile.isPending}
            />
            <p className="text-xs text-muted-foreground">
              International format (E.164): +[country code][number]
            </p>
            <p className="text-xs text-muted-foreground italic">
              This is for your profile only. It is not used for login or authentication.
            </p>
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim()}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
