import { Outlet } from '@tanstack/react-router';

export default function NeonScaffold() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0e1a]">
      {/* Cyber circuit background */}
      <div 
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: 'url(/assets/generated/jero-chat-bg.dim_1920x1080.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Animated gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse-glow" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Outlet />
      </div>
    </div>
  );
}
