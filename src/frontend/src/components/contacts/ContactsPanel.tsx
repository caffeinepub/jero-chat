import { useState } from 'react';
import { useGetUserContacts, useGetUserBasicInfo, useGetUserPresence } from '../../hooks/useQueries';
import AddContactDialog from './AddContactDialog';
import PresenceDot from '../presence/PresenceDot';
import PresenceStatusText from '../presence/PresenceStatusText';
import { Button } from '../ui/button';
import { UserPlus, Loader2, User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Principal } from '@icp-sdk/core/principal';

interface ContactsPanelProps {
  onSelectContact: (contact: Principal) => void;
}

export default function ContactsPanel({ onSelectContact }: ContactsPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: contacts = [], isLoading } = useGetUserContacts();

  return (
    <div className="flex h-full flex-col">
      {/* Add Contact Button */}
      <div className="border-b border-primary/30 p-4">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="w-full bg-primary/20 hover:bg-primary/30"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No contacts yet. Add your first contact to start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {contacts.map((contact) => (
              <ContactItem
                key={contact.toString()}
                contact={contact}
                onSelect={onSelectContact}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Contact Dialog */}
      <AddContactDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}

interface ContactItemProps {
  contact: Principal;
  onSelect: (contact: Principal) => void;
}

function ContactItem({ contact, onSelect }: ContactItemProps) {
  const { data: basicInfo } = useGetUserBasicInfo(contact);
  const { data: presenceData, isLoading: presenceLoading } = useGetUserPresence(contact);

  const displayName = basicInfo?.[1] || 'Unknown User';
  const isOnline = presenceData?.isOnline ?? false;
  const lastSeen = presenceData?.lastSeen ?? null;

  return (
    <button
      onClick={() => onSelect(contact)}
      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/10"
    >
      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
        <User className="h-6 w-6 text-primary" />
        {/* Always show presence dot */}
        <div className="absolute bottom-0 right-0">
          <PresenceDot isOnline={isOnline} />
        </div>
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">{displayName}</p>
          <span className="text-xs">
            <PresenceStatusText 
              isOnline={isOnline} 
              lastSeen={lastSeen} 
              isLoading={presenceLoading} 
            />
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {contact.toString().slice(0, 12)}...
        </p>
      </div>
    </button>
  );
}
