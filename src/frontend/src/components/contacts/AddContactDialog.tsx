import { useState } from 'react';
import { Principal } from '@icp-sdk/core/principal';
import { useAddContact, useAddContactByPhone } from '../../hooks/useQueries';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { validatePhoneNumber } from '../../utils/phoneNumber';

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddContactDialog({ open, onOpenChange }: AddContactDialogProps) {
  const [principalText, setPrincipalText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [principalError, setPrincipalError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const addContact = useAddContact();
  const addContactByPhone = useAddContactByPhone();

  const handlePrincipalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrincipalError('');

    if (!principalText.trim()) {
      setPrincipalError('Please enter a principal ID');
      return;
    }

    let principal: Principal;
    try {
      principal = Principal.fromText(principalText.trim());
    } catch (error) {
      setPrincipalError('Invalid principal ID format');
      return;
    }

    try {
      await addContact.mutateAsync(principal);
      toast.success('Contact added successfully!');
      setPrincipalText('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to add contact', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }

    try {
      await addContactByPhone.mutateAsync(validation.normalized!);
      toast.success('Contact added successfully!');
      setPhoneNumber('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to add contact', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPrincipalText('');
      setPhoneNumber('');
      setPrincipalError('');
      setPhoneError('');
    }
    onOpenChange(newOpen);
  };

  const isPending = addContact.isPending || addContactByPhone.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Add a friend by their principal ID or phone number.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="principal">Principal ID</TabsTrigger>
            <TabsTrigger value="phone">Phone Number</TabsTrigger>
          </TabsList>

          <TabsContent value="principal" className="space-y-4">
            <form onSubmit={handlePrincipalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Principal ID</Label>
                <Input
                  id="principal"
                  value={principalText}
                  onChange={(e) => {
                    setPrincipalText(e.target.value);
                    setPrincipalError('');
                  }}
                  placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                  disabled={isPending}
                />
                {principalError && (
                  <p className="text-sm text-destructive">{principalError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !principalText.trim()}
                  className="flex-1"
                >
                  {addContact.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Contact'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="+1234567890"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Enter in international format (E.164): +[country code][number]
                </p>
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !phoneNumber.trim()}
                  className="flex-1"
                >
                  {addContactByPhone.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Contact'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
