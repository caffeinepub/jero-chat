import { useState, useRef } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputBarProps {
  onSendMessage: (text: string, attachment?: File) => Promise<void>;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

export default function MessageInputBar({ onSendMessage }: MessageInputBarProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: 'Maximum file size is 1 GB. Please choose a smaller file.',
      });
      return;
    }

    setAttachment(file);
    toast.success('File attached', {
      description: file.name,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !attachment) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim(), attachment || undefined);
      setMessage('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error('Failed to send message', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative z-20 border-t border-primary/30 bg-[#0f1419]/95 px-4 py-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 transition-all hover:bg-primary/30 disabled:opacity-50"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5 text-primary" />
        </button>
        <div className="cyber-border-teal relative flex-1 overflow-hidden rounded-full bg-card/50 backdrop-blur-sm">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={attachment ? `Attached: ${attachment.name}` : 'Type your message...'}
            disabled={isSending}
            className="w-full bg-transparent px-5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={(!message.trim() && !attachment) || isSending}
          className="cyber-border-teal neon-glow-teal flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 transition-all hover:bg-primary/30 hover:shadow-neon-teal disabled:opacity-50 disabled:hover:bg-primary/20"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <img
              src="/assets/generated/send-icon-neon.dim_256x256.png"
              alt="Send"
              className="h-6 w-6"
            />
          )}
        </button>
      </form>
    </div>
  );
}
