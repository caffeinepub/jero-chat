import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Wifi, Battery, Crown, Download } from 'lucide-react';
import ChatBubble from '../components/chat/ChatBubble';
import MessageInputBar from '../components/chat/MessageInputBar';

interface Message {
  id: string;
  text: string;
  isOutgoing: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hey saw the new update. Loeek!',
    isOutgoing: false,
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    text: 'Thanks! We pushed to Looks sleek!',
    isOutgoing: false,
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    text: 'cyber+-cyber-mode theme. Super fast think?',
    isOutgoing: false,
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: '4',
    text: 'Definitely dig neon acconts. Super features too.',
    isOutgoing: true,
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '5',
    text: 'Glad fifted like! More coming.',
    isOutgoing: true,
    timestamp: new Date(Date.now() - 60000),
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const navigate = useNavigate();

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isOutgoing: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handlePremiumClick = () => {
    navigate({ to: '/premium' });
  };

  const handleDownloadClick = () => {
    navigate({ to: '/download' });
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-primary/30 bg-[#0f1419]/95 px-4 py-3 backdrop-blur-sm">
        <h1 className="neon-text-teal font-display text-2xl font-bold tracking-wider">
          Jero Chat
        </h1>
        <div className="flex items-center gap-3">
          <Wifi className="h-5 w-5 text-primary" />
          <Battery className="h-5 w-5 text-primary" />
          <button
            onClick={handleDownloadClick}
            className="rounded-lg bg-primary/20 p-2 transition-all hover:bg-primary/30 hover:shadow-neon-teal"
            aria-label="Download / Install"
          >
            <Download className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={handlePremiumClick}
            className="rounded-lg bg-secondary/20 p-2 transition-all hover:bg-secondary/30 hover:shadow-neon-purple"
            aria-label="View Premium Features"
          >
            <Crown className="h-5 w-5 text-secondary" />
          </button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              text={message.text}
              isOutgoing={message.isOutgoing}
            />
          ))}
        </div>
      </main>

      {/* Message Input Bar */}
      <MessageInputBar onSendMessage={handleSendMessage} />
    </div>
  );
}
