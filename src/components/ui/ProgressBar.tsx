import { StatusCounts } from '@/types/plan';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  statusCounts: StatusCounts;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export function ProgressBar({
  statusCounts,
  size = 'sm',
  showLabels = false,
  className
}: ProgressBarProps) {
  const { pending, approved, rejected, resolved, total } = statusCounts;
  const reviewed = approved + rejected + resolved;

  if (total === 0) return null;

  const getPercent = (count: number) => (count / total) * 100;

  const segments = [
    { status: 'approved', count: approved, color: 'bg-emerald-500 dark:bg-emerald-400' },
    { status: 'resolved', count: resolved, color: 'bg-slate-400 dark:bg-slate-500' },
    { status: 'rejected', count: rejected, color: 'bg-rose-500 dark:bg-rose-400' },
    { status: 'pending', count: pending, color: 'bg-amber-400 dark:bg-amber-500' },
  ].filter(s => s.count > 0);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className={cn(
          'flex w-full overflow-hidden rounded-full bg-muted/50',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        {segments.map((segment, i) => (
          <div
            key={segment.status}
            className={cn(
              segment.color,
              'transition-all duration-300',
              i === 0 && 'rounded-l-full',
              i === segments.length - 1 && 'rounded-r-full'
            )}
            style={{ width: `${getPercent(segment.count)}%` }}
            title={`${segment.status}: ${segment.count}`}
          />
        ))}
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{reviewed} of {total} reviewed</span>
          {approved > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              {approved} approved
            </span>
          )}
        </div>
      )}
    </div>
  );
}
