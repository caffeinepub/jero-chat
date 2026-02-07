import { useGetUserContacts, useGetUserBasicInfo, useGetUserPresence } from '../../hooks/useQueries';
import PresenceDot from '../presence/PresenceDot';
import PresenceStatusText from '../presence/PresenceStatusText';
import { Loader2, MessageSquare, User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Principal } from '@icp-sdk/core/principal';

interface ConversationsListProps {
  onSelectContact: (contact: Principal) => void;
}

export default function ConversationsList({ onSelectContact }: ConversationsListProps) {
  const { data: contacts = [], isLoading } = useGetUserContacts();

  return (
    <ScrollArea className="h-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No conversations yet. Add a contact to start chatting!
          </p>
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {contacts.map((contact) => (
            <ConversationItem
              key={contact.toString()}
              contact={contact}
              onSelect={onSelectContact}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

interface ConversationItemProps {
  contact: Principal;
  onSelect: (contact: Principal) => void;
}

function ConversationItem({ contact, onSelect }: ConversationItemProps) {
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
        <p className="font-medium text-foreground">{displayName}</p>
        <p className="text-xs">
          <PresenceStatusText 
            isOnline={isOnline} 
            lastSeen={lastSeen} 
            isLoading={presenceLoading} 
          />
        </p>
      </div>
    </button>
  );
}
