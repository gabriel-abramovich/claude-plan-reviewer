import { useState, useRef, useEffect } from 'react';
import { usePlanStore } from '@/stores/plan-store';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  planId: string;
  sectionId: string;
  heading: string;
}

export function CommentForm({ planId, sectionId, heading }: CommentFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addComment } = usePlanStore();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(planId, sectionId, text.trim(), heading);
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What changes would you like? What questions do you have?"
          rows={2}
          className={cn(
            'w-full resize-none rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm leading-relaxed',
            'placeholder:text-muted-foreground/40',
            'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all'
          )}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/40">
          Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
        </span>

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Send size={12} />
          <span>Add feedback</span>
        </button>
      </div>
    </form>
  );
}
