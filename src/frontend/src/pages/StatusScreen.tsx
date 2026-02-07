import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import StatusComposerDialog from '../components/status/StatusComposerDialog';
import VisibleStatusesList from '../components/status/VisibleStatusesList';
import StatusViewer from '../components/status/StatusViewer';
import { useGetVisibleStatuses } from '../hooks/useQueries';
import type { StatusItem } from '../backend';

export default function StatusScreen() {
  const navigate = useNavigate();
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedStatusItems, setSelectedStatusItems] = useState<StatusItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const { data: visibleStatuses, isLoading } = useGetVisibleStatuses();

  const handleStatusClick = (items: StatusItem[], index: number) => {
    setSelectedStatusItems(items);
    setStartIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedStatusItems([]);
    setStartIndex(0);
  };

  const handleStatusDeleted = (statusId: bigint) => {
    // Remove the deleted status from the current viewer items
    const updatedItems = selectedStatusItems.filter((item) => item.id !== statusId);
    
    if (updatedItems.length === 0) {
      // No more items, close viewer
      handleCloseViewer();
    } else {
      // Update the items list
      setSelectedStatusItems(updatedItems);
      
      // Adjust startIndex if needed
      if (startIndex >= updatedItems.length) {
        setStartIndex(updatedItems.length - 1);
      }
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="cyber-border-teal neon-glow-teal border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/' })}
              className="text-primary hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="neon-text-teal font-display text-2xl font-bold">Status</h1>
          </div>
          <Button
            onClick={() => setComposerOpen(true)}
            size="icon"
            className="neon-glow-teal bg-primary/20 hover:bg-primary/30"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visibleStatuses && visibleStatuses.length > 0 ? (
          <VisibleStatusesList statuses={visibleStatuses} onStatusSelect={handleStatusClick} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">
              No statuses available. Create your first status or add contacts to see their updates.
            </p>
            <Button
              onClick={() => setComposerOpen(true)}
              className="neon-glow-teal bg-primary/20 hover:bg-primary/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Status
            </Button>
          </div>
        )}
      </main>

      {/* Status Composer Dialog */}
      <StatusComposerDialog open={composerOpen} onOpenChange={setComposerOpen} />

      {/* Status Viewer */}
      {selectedStatusItems.length > 0 && (
        <StatusViewer
          statusItems={selectedStatusItems}
          startIndex={startIndex}
          onClose={handleCloseViewer}
          onDeleted={handleStatusDeleted}
        />
      )}
    </div>
  );
}
