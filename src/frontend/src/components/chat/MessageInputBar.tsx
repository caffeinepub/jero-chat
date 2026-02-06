import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
}

export default function MessageInputBar({ onSendMessage }: MessageInputBarProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="relative z-20 border-t border-primary/30 bg-[#0f1419]/95 px-4 py-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="cyber-border-teal relative flex-1 overflow-hidden rounded-full bg-card/50 backdrop-blur-sm">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-transparent px-5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim()}
          className="cyber-border-teal neon-glow-teal flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 transition-all hover:bg-primary/30 hover:shadow-neon-teal disabled:opacity-50 disabled:hover:bg-primary/20"
          aria-label="Send message"
        >
          <img
            src="/assets/generated/send-icon-neon.dim_256x256.png"
            alt="Send"
            className="h-6 w-6"
          />
        </button>
      </form>
    </div>
  );
}
