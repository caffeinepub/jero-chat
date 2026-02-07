import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, Loader2 } from 'lucide-react';
import { useGetUserBasicInfo, useSendMessage, useGetConversationWithContact, useGetUserPresence } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import ChatBubble from './ChatBubble';
import MessageInputBar from './MessageInputBar';
import PresenceDot from '../presence/PresenceDot';
import PresenceStatusText from '../presence/PresenceStatusText';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { Principal } from '@icp-sdk/core/principal';
import type { Message as BackendMessage } from '../../backend';

interface ChatThreadProps {
  contact: Principal;
  onBack: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

interface UIMessage {
  id: string;
  text: string;
  isOutgoing: boolean;
  timestamp: Date;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

export default function ChatThread({ contact, onBack, onAudioCall, onVideoCall }: ChatThreadProps) {
  const [optimisticMessages, setOptimisticMessages] = useState<UIMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { identity } = useInternetIdentity();
  const { data: basicInfo } = useGetUserBasicInfo(contact);
  const { data: conversation = [], isLoading: conversationLoading, error: conversationError } = useGetConversationWithContact(contact);
  const { data: presenceData, isLoading: presenceLoading } = useGetUserPresence(contact);
  const sendMessage = useSendMessage();

  const displayName = basicInfo?.[1] || 'Unknown User';
  const isOnline = presenceData?.isOnline ?? false;
  const lastSeen = presenceData?.lastSeen ?? null;

  // Convert backend messages to UI format
  const backendMessages: UIMessage[] = conversation.map((msg: BackendMessage) => ({
    id: `${msg.timestamp}-${msg.from.toString()}`,
    text: msg.content,
    isOutgoing: identity ? msg.from.toString() === identity.getPrincipal().toString() : false,
    timestamp: new Date(Number(msg.timestamp) / 1_000_000), // Convert nanoseconds to milliseconds
  }));

  // Combine backend messages with optimistic messages
  const allMessages = [...backendMessages, ...optimisticMessages];

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages]);

  // Clear optimistic messages when backend conversation updates
  useEffect(() => {
    if (conversation.length > 0) {
      setOptimisticMessages([]);
    }
  }, [conversation]);

  const handleSendMessage = async (text: string, attachment?: File) => {
    if (!text.trim() && !attachment) return;

    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message
    const newMessage: UIMessage = {
      id: tempId,
      text,
      isOutgoing: true,
      timestamp: new Date(),
    };

    if (attachment) {
      newMessage.attachment = {
        url: URL.createObjectURL(attachment),
        type: attachment.type,
        name: attachment.name,
      };
    }

    setOptimisticMessages((prev) => [...prev, newMessage]);

    try {
      await sendMessage.mutateAsync({ recipient: contact, content: text });
      // Backend will invalidate and refetch, clearing optimistic messages
    } catch (error: any) {
      // Remove optimistic message on error
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error('Failed to send message', {
        description: error?.message || 'Please try again',
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <span className="text-lg font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
            {/* Always show presence dot */}
            <div className="absolute bottom-0 right-0">
              <PresenceDot isOnline={isOnline} />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-xs">
              <PresenceStatusText 
                isOnline={isOnline} 
                lastSeen={lastSeen} 
                isLoading={presenceLoading} 
              />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAudioCall}
            className="hover:bg-primary/20"
          >
            <Phone className="h-5 w-5 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onVideoCall}
            className="hover:bg-primary/20"
          >
            <Video className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {conversationLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversationError ? (
            <div className="py-12 text-center">
              <p className="text-destructive">
                Failed to load conversation history
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please try again later
              </p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            allMessages.map((message) => (
              <ChatBubble
                key={message.id}
                text={message.text}
                isOutgoing={message.isOutgoing}
                timestamp={message.timestamp}
                attachment={message.attachment}
              />
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <MessageInputBar onSendMessage={handleSendMessage} />
    </div>
  );
}
