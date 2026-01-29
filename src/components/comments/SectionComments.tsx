import { SectionReview } from '@/types/comment';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { X, MessageSquare, Lightbulb, ChevronDown } from 'lucide-react';

interface SectionCommentsProps {
  planId: string;
  sectionId: string;
  heading: string;
  sectionReview?: SectionReview;
  onClose: () => void;
}

export function SectionComments({
  planId,
  sectionId,
  heading,
  sectionReview,
  onClose,
}: SectionCommentsProps) {
  const comments = sectionReview?.comments || [];
  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          <h4 className="text-sm font-semibold">
            Feedback
            {unresolvedComments.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {unresolvedComments.length} pending
              </span>
            )}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground/50 transition-all hover:bg-muted/50 hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4">
        {/* Workflow guidance */}
        {comments.length === 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3">
            <Lightbulb size={14} className="mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Add feedback for Claude to address. Comments are saved automatically and injected into Claude's context for the next conversation.
            </p>
          </div>
        )}

        {/* Comment form */}
        <CommentForm planId={planId} sectionId={sectionId} heading={heading} />

        {/* Unresolved comments */}
        {unresolvedComments.length > 0 && (
          <div className="mt-4 space-y-3">
            {unresolvedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} planId={planId} />
            ))}
          </div>
        )}

        {/* Resolved comments */}
        {resolvedComments.length > 0 && (
          <div className="mt-4">
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                {resolvedComments.length} resolved comment{resolvedComments.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-3 space-y-3 opacity-50">
                {resolvedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} planId={planId} />
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty state */}
        {comments.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
            <MessageSquare size={24} className="text-muted-foreground/20 mb-2" />
            <p className="text-sm font-medium text-muted-foreground/60">No feedback yet</p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              Add comments to request changes or ask questions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
