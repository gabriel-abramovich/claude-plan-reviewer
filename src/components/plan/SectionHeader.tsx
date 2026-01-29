import { SectionStatus } from '@/types/comment';
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  heading: string;
  level: number;
  status: SectionStatus;
  commentCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleComments: () => void;
  onStatusChange: (status: SectionStatus) => void;
}

const statusConfig: Record<SectionStatus, {
  badge: string;
  label: string;
  icon: typeof Check;
}> = {
  pending: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    label: 'Pending',
    icon: RotateCcw,
  },
  approved: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    label: 'Approved',
    icon: Check,
  },
  rejected: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
    label: 'Needs Work',
    icon: X,
  },
  resolved: {
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
    label: 'Addressed',
    icon: CheckCircle2,
  },
};

const headingSizes: Record<number, string> = {
  1: 'text-xl',
  2: 'text-lg',
  3: 'text-base',
  4: 'text-sm',
  5: 'text-sm',
  6: 'text-sm',
};

export function SectionHeader({
  heading,
  level,
  status,
  commentCount,
  isCollapsed,
  onToggleCollapse,
  onToggleComments,
  onStatusChange,
}: SectionHeaderProps) {
  const config = statusConfig[status];

  return (
    <div className="group flex items-center gap-3 py-2">
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="rounded-md p-1 text-muted-foreground/50 transition-all hover:bg-muted/50 hover:text-foreground"
        title={isCollapsed ? 'Expand section' : 'Collapse section'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Heading */}
      <span className={cn(
        'flex-1 font-display font-medium tracking-tight',
        headingSizes[level] || 'text-base',
        status === 'resolved' && 'text-muted-foreground'
      )}>
        {heading}
      </span>

      {/* Status badge */}
      <span className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
        config.badge
      )}>
        <config.icon size={10} />
        {config.label}
      </span>

      {/* Comment button - always visible when has comments */}
      <button
        onClick={onToggleComments}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
          commentCount > 0
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60'
            : 'text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-muted/50 hover:text-foreground'
        )}
        title="View/add feedback"
      >
        <MessageSquare size={14} />
        {commentCount > 0 ? (
          <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
        ) : (
          <span>Add feedback</span>
        )}
      </button>

      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Approve button */}
        <button
          onClick={() => onStatusChange('approved')}
          className={cn(
            'rounded-lg p-1.5 transition-all',
            status === 'approved'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'text-muted-foreground/50 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300'
          )}
          title="Approve this section (a)"
        >
          <Check size={16} />
        </button>

        {/* Reject button */}
        <button
          onClick={() => onStatusChange('rejected')}
          className={cn(
            'rounded-lg p-1.5 transition-all',
            status === 'rejected'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              : 'text-muted-foreground/50 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/40 dark:hover:text-rose-300'
          )}
          title="Request changes (r)"
        >
          <X size={16} />
        </button>

        {/* Resolve button - only shown when not resolved */}
        {status !== 'resolved' && status !== 'pending' && (
          <button
            onClick={() => onStatusChange('resolved')}
            className="rounded-lg p-1.5 text-muted-foreground/50 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
            title="Mark as addressed"
          >
            <CheckCircle2 size={16} />
          </button>
        )}

        {/* Reset to pending */}
        {status !== 'pending' && (
          <button
            onClick={() => onStatusChange('pending')}
            className="rounded-lg p-1.5 text-muted-foreground/50 transition-all hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/40 dark:hover:text-amber-300"
            title="Reset to pending"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
