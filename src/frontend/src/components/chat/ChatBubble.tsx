interface ChatBubbleProps {
  text: string;
  isOutgoing: boolean;
}

export default function ChatBubble({ text, isOutgoing }: ChatBubbleProps) {
  if (isOutgoing) {
    return (
      <div className="flex justify-end">
        <div className="cyber-border-teal neon-glow-teal max-w-[80%] rounded-3xl rounded-br-md bg-primary/10 px-5 py-3 backdrop-blur-sm">
          <p className="text-base leading-relaxed text-foreground">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="cyber-border-purple neon-glow-purple max-w-[80%] rounded-3xl rounded-bl-md bg-secondary/10 px-5 py-3 backdrop-blur-sm">
        <p className="text-base leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}
