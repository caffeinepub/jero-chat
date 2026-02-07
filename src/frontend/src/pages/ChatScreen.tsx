import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetCallerUserProfile, useGetCallerProfilePhoto } from '../hooks/useQueries';
import { usePresenceHeartbeat } from '../hooks/usePresenceHeartbeat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { LogOut, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ContactsPanel from '../components/contacts/ContactsPanel';
import ConversationsList from '../components/conversations/ConversationsList';
import ChatThread from '../components/chat/ChatThread';
import type { Principal } from '@icp-sdk/core/principal';
import UserAvatar from '../components/profile/UserAvatar';

export default function ChatScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear, identity } = useInternetIdentity();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: profilePhoto } = useGetCallerProfilePhoto();

  // Run presence heartbeat while authenticated
  usePresenceHeartbeat();

  const [selectedContact, setSelectedContact] = useState<Principal | null>(null);

  const handleLogout = async () => {
    try {
      await clear();
      queryClient.clear();
      navigate({ to: '/login' });
    } catch (error) {
      toast.error('Failed to logout', {
        description: 'Please try again',
      });
    }
  };

  const handleContactSelect = (contact: Principal) => {
    setSelectedContact(contact);
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  const handleProfileClick = () => {
    navigate({ to: '/profile' });
  };

  const handleAdminClick = () => {
    navigate({ to: '/admin/help' });
  };

  const handleStatusClick = () => {
    navigate({ to: '/status' });
  };

  const handleAudioCall = () => {
    toast.info('Audio Call', {
      description: 'Audio calling feature coming soon!',
    });
  };

  const handleVideoCall = () => {
    toast.info('Video Call', {
      description: 'Video calling feature coming soon!',
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/jero-chat-logo.dim_512x512.png"
            alt="Jero Chat"
            className="h-10 w-10"
          />
          <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
            JERO
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStatusClick}
            variant="ghost"
            size="icon"
            className="text-secondary hover:bg-secondary/20"
            title="Status"
          >
            <Zap className="h-5 w-5" />
          </Button>
          {isAdmin && (
            <Button
              onClick={handleAdminClick}
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-primary/20"
              title="Admin Help"
            >
              <Shield className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={handleProfileClick}
            className="rounded-full transition-all hover:opacity-80"
            aria-label="Profile"
          >
            <UserAvatar
              photo={profilePhoto}
              name={userProfile?.name}
              size="md"
            />
          </button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/20"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex flex-1 overflow-hidden">
        {selectedContact ? (
          <ChatThread
            contact={selectedContact}
            onBack={handleBackToList}
            onAudioCall={handleAudioCall}
            onVideoCall={handleVideoCall}
          />
        ) : (
          <div className="flex flex-1 flex-col">
            <Tabs defaultValue="conversations" className="flex flex-1 flex-col">
              <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
              </TabsList>
              <TabsContent value="conversations" className="flex-1 overflow-hidden">
                <ConversationsList onSelectContact={handleContactSelect} />
              </TabsContent>
              <TabsContent value="contacts" className="flex-1 overflow-hidden">
                <ContactsPanel onSelectContact={handleContactSelect} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
