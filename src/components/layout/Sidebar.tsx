import { useMemo } from 'react';
import { usePlanStore, usePlans } from '@/stores/plan-store';
import { Search, FileText, Clock, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusCounts } from '@/types/plan';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const filterConfig: Record<FilterStatus, {
  label: string;
  icon: typeof Circle;
  activeColor: string;
  countKey?: keyof StatusCounts;
}> = {
  all: {
    label: 'All',
    icon: Circle,
    activeColor: 'bg-slate-600 text-white dark:bg-slate-500',
  },
  pending: {
    label: 'Pending',
    icon: Circle,
    activeColor: 'bg-amber-500 text-white',
    countKey: 'pending',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    activeColor: 'bg-emerald-600 text-white dark:bg-emerald-500',
    countKey: 'approved',
  },
  rejected: {
    label: 'Needs Work',
    icon: AlertCircle,
    activeColor: 'bg-rose-500 text-white',
    countKey: 'rejected',
  },
};

export function Sidebar() {
  const { activePlanId, setActivePlan, searchQuery, setSearchQuery, filterStatus, setFilterStatus } =
    usePlanStore();
  const plans = usePlans();

  // Aggregate status counts across all plans
  const aggregatedCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, resolved: 0, total: 0 };
    for (const plan of plans) {
      if (plan.statusCounts) {
        counts.pending += plan.statusCounts.pending;
        counts.approved += plan.statusCounts.approved;
        counts.rejected += plan.statusCounts.rejected;
        counts.resolved += plan.statusCounts.resolved;
        counts.total += plan.statusCounts.total;
      }
    }
    return counts;
  }, [plans]);

  // Filter plans by search query AND status
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        searchQuery === '' ||
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by status
      if (filterStatus === 'all') return true;
      if (!plan.statusCounts) return filterStatus === 'pending';

      switch (filterStatus) {
        case 'pending':
          return plan.statusCounts.pending > 0;
        case 'approved':
          // Show plans that are fully approved (all sections approved or resolved)
          return plan.statusCounts.approved + plan.statusCounts.resolved === plan.statusCounts.total;
        case 'rejected':
          return plan.statusCounts.rejected > 0;
        default:
          return true;
      }
    });
  }, [plans, searchQuery, filterStatus]);

  const getFilterCount = (status: FilterStatus): number => {
    if (status === 'all') return plans.length;
    const countKey = filterConfig[status].countKey;
    if (!countKey) return plans.length;
    return plans.filter(p => {
      if (!p.statusCounts) return status === 'pending';
      if (status === 'approved') {
        return p.statusCounts.approved + p.statusCounts.resolved === p.statusCounts.total;
      }
      return p.statusCounts[countKey] > 0;
    }).length;
  };

  return (
    <div className="flex h-full flex-col bg-card/50">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="font-display text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Plans
        </h2>
      </div>

      {/* Search */}
      <div className="border-b border-border/50 p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
          />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-background/50 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/50 p-2">
        {(Object.keys(filterConfig) as FilterStatus[]).map((status) => {
          const config = filterConfig[status];
          const count = getFilterCount(status);
          const isActive = filterStatus === status;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              type="button"
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer select-none',
                isActive
                  ? config.activeColor
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <span>{config.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center',
                  isActive
                    ? 'bg-white/20 text-inherit'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plan List */}
      <div className="flex-1 overflow-auto">
        {filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <FileText size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/60 text-center">
              {searchQuery ? 'No plans match your search' : 'No plans found'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {filteredPlans.map((plan) => {
              const isActive = activePlanId === plan.id;
              const reviewed = plan.statusCounts
                ? plan.statusCounts.approved + plan.statusCounts.rejected + plan.statusCounts.resolved
                : 0;
              const total = plan.statusCounts?.total || 0;

              return (
                <li key={plan.id}>
                  <button
                    onClick={() => setActivePlan(plan.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-all',
                      isActive
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        size={16}
                        className={cn(
                          'mt-0.5 flex-shrink-0',
                          isActive ? 'text-primary' : 'text-muted-foreground/50'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'truncate font-display text-sm font-medium',
                            isActive ? 'text-foreground' : 'text-foreground/80'
                          )}
                        >
                          {plan.title}
                        </div>

                        {/* Progress Bar */}
                        {plan.statusCounts && total > 0 && (
                          <div className="mt-2">
                            <ProgressBar statusCounts={plan.statusCounts} size="sm" />
                            <div className="mt-1 text-[10px] text-muted-foreground/60">
                              {reviewed}/{total} sections reviewed
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/50">
                          <Clock size={10} />
                          <span>{formatRelativeTime(plan.modifiedAt)}</span>
                          {plan.unresolvedCount > 0 && (
                            <>
                              <span className="text-border">·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {plan.unresolvedCount} unresolved
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
          <span>{plans.length} plan{plans.length !== 1 ? 's' : ''}</span>
          {aggregatedCounts.total > 0 && (
            <span>
              {aggregatedCounts.approved + aggregatedCounts.resolved}/{aggregatedCounts.total} reviewed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
