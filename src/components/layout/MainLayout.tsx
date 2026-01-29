import { usePlanStore, useComments } from '@/stores/plan-store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PlanViewer } from '@/components/plan/PlanViewer';
import { SectionNav } from '@/components/plan/SectionNav';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';

export function MainLayout() {
  const { sidebarOpen, activePlan, isLoading, error, activePlanId } = usePlanStore();
  const commentsData = useComments(activePlanId || '');

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Plans list */}
        <aside
          className={cn(
            'flex-shrink-0 border-r border-border/50 transition-all duration-200 ease-out',
            sidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {sidebarOpen && <Sidebar />}
        </aside>

        {/* Section Navigation - Middle column */}
        {activePlan && (
          <aside className="w-64 flex-shrink-0 border-r border-border/50 overflow-auto bg-card/30">
            <SectionNav
              sections={activePlan.sections}
              comments={commentsData}
            />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {error && (
            <div className="m-6 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 text-rose-700 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {isLoading && !activePlan ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground/60">Loading plans...</span>
              </div>
            </div>
          ) : activePlan ? (
            <div className="p-6 lg:p-8 max-w-4xl">
              <PlanViewer plan={activePlan} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <FolderOpen size={28} className="text-muted-foreground/40" />
                </div>
                <p className="font-display text-lg font-semibold text-foreground/80">No plan selected</p>
                <p className="mt-1.5 text-sm text-muted-foreground/60">
                  Select a plan from the sidebar to start reviewing
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
