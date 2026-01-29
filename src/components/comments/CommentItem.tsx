import { Comment } from '@/types/comment';
import { usePlanStore } from '@/stores/plan-store';
import { Check, Trash2, User, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  planId: string;
}

export function CommentItem({ comment, planId }: CommentItemProps) {
  const { resolveComment, deleteComment } = usePlanStore();

  return (
    <div
      className={cn(
        'group rounded-lg border bg-background/50 p-3 transition-all',
        comment.resolved
          ? 'border-slate-200/50 dark:border-slate-700/30'
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
          comment.resolved
            ? 'bg-slate-100 dark:bg-slate-800/50'
            : 'bg-primary/10 dark:bg-primary/20'
        )}>
          <User size={14} className={cn(
            comment.resolved
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-primary'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-semibold',
              comment.resolved && 'text-muted-foreground/60'
            )}>
              {comment.author}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={10} />
                resolved
              </span>
            )}
          </div>

          {/* Text */}
          <p className={cn(
            'mt-1.5 text-sm leading-relaxed whitespace-pre-wrap',
            comment.resolved && 'text-muted-foreground/60'
          )}>
            {comment.text}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!comment.resolved && (
            <button
              onClick={() => resolveComment(planId, comment.id)}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
              title="Mark as resolved"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => deleteComment(planId, comment.id)}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
            title="Delete comment"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
