import { usePlanStore, useActivePlan, useTheme } from '@/stores/plan-store';
import { PanelLeftClose, PanelLeft, Sun, Moon, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useMemo } from 'react';
import { StatusCounts } from '@/types/plan';

export function Header() {
  const { sidebarOpen, toggleSidebar, setTheme, comments, activePlanId } = usePlanStore();
  const activePlan = useActivePlan();
  const theme = useTheme();

  // Compute status counts for active plan
  const statusCounts = useMemo((): StatusCounts | null => {
    if (!activePlan || !activePlanId) return null;

    const counts: StatusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      resolved: 0,
      total: 0,
    };

    // Count all sections recursively
    const countSections = (sections: typeof activePlan.sections): void => {
      for (const section of sections) {
        counts.total++;
        const review = comments[activePlanId]?.sections.find(s => s.sectionId === section.id);
        const status = review?.status || 'pending';
        counts[status]++;
        if (section.children) {
          countSections(section.children);
        }
      }
    };

    countSections(activePlan.sections);
    return counts;
  }, [activePlan, activePlanId, comments]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const reviewed = statusCounts
    ? statusCounts.approved + statusCounts.rejected + statusCounts.resolved
    : 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className={cn(
            'rounded-lg p-2 text-muted-foreground/70 transition-all hover:bg-muted/50 hover:text-foreground'
          )}
          title={sidebarOpen ? 'Hide sidebar (Cmd+/)' : 'Show sidebar (Cmd+/)'}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>

        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h1 className="font-display text-base font-semibold tracking-tight">Plan Review</h1>
        </div>

        {activePlan && (
          <>
            <span className="text-muted-foreground/30 font-light">/</span>
            <span className="font-display text-sm font-medium text-foreground/70">{activePlan.title}</span>

            {/* Progress Stats */}
            {statusCounts && statusCounts.total > 0 && (
              <div className="ml-4 flex items-center gap-4">
                <ProgressBar
                  statusCounts={statusCounts}
                  size="sm"
                  className="w-32"
                />

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground/60">
                    {reviewed}/{statusCounts.total}
                  </span>

                  {statusCounts.approved > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      {statusCounts.approved}
                    </span>
                  )}

                  {statusCounts.rejected > 0 && (
                    <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                      <XCircle size={12} />
                      {statusCounts.rejected}
                    </span>
                  )}

                  {statusCounts.pending > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock size={12} />
                      {statusCounts.pending}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground/70 transition-all hover:bg-muted/50 hover:text-foreground"
          title="Toggle theme (t)"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
