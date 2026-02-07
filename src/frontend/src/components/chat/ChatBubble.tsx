import { Check, CheckCheck, Download } from 'lucide-react';

interface ChatBubbleProps {
  text: string;
  isOutgoing: boolean;
  timestamp?: Date;
  status?: 'sent' | 'delivered' | 'seen';
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

export default function ChatBubble({ text, isOutgoing, timestamp, status = 'sent', attachment }: ChatBubbleProps) {
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = attachment?.type.startsWith('image/');

  if (isOutgoing) {
    return (
      <div className="flex justify-end">
        <div className="cyber-border-teal neon-glow-teal max-w-[80%] rounded-3xl rounded-br-md bg-primary/10 px-5 py-3 backdrop-blur-sm">
          {attachment && (
            <div className="mb-2">
              {isImage ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-h-64 rounded-lg"
                />
              ) : (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="flex items-center gap-2 rounded-lg bg-primary/20 p-3 hover:bg-primary/30"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm">{attachment.name}</span>
                </a>
              )}
            </div>
          )}
          {text && <p className="text-base leading-relaxed text-foreground">{text}</p>}
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>{formatTime(timestamp)}</span>
            {status === 'seen' ? (
              <CheckCheck className="h-3 w-3 text-primary" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="cyber-border-purple neon-glow-purple max-w-[80%] rounded-3xl rounded-bl-md bg-secondary/10 px-5 py-3 backdrop-blur-sm">
        {attachment && (
          <div className="mb-2">
            {isImage ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-64 rounded-lg"
              />
            ) : (
              <a
                href={attachment.url}
                download={attachment.name}
                className="flex items-center gap-2 rounded-lg bg-secondary/20 p-3 hover:bg-secondary/30"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">{attachment.name}</span>
              </a>
            )}
          </div>
        )}
        {text && <p className="text-base leading-relaxed text-foreground">{text}</p>}
        {timestamp && (
          <p className="mt-1 text-xs text-muted-foreground">{formatTime(timestamp)}</p>
        )}
      </div>
    </div>
  );
}
