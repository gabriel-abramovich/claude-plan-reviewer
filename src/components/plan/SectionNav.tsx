import { useMemo, useState, useEffect } from 'react';
import { ParsedSection } from '@/types/plan';
import { SectionReview, SectionStatus } from '@/types/comment';
import { usePlanStore } from '@/stores/plan-store';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, List } from 'lucide-react';

interface SectionNavProps {
  sections: ParsedSection[];
  comments: { sections: SectionReview[] } | null;
}

interface FlatSection {
  id: string;
  heading: string;
  level: number;
  status: SectionStatus;
}

const statusDotColors: Record<SectionStatus, string> = {
  pending: 'bg-amber-400',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  resolved: 'bg-slate-400',
};

function flattenSections(
  sections: ParsedSection[],
  comments: { sections: SectionReview[] } | null,
  result: FlatSection[] = []
): FlatSection[] {
  for (const section of sections) {
    const review = comments?.sections.find(s => s.sectionId === section.id);
    result.push({
      id: section.id,
      heading: section.heading,
      level: section.level,
      status: review?.status || 'pending',
    });
    if (section.children.length > 0) {
      flattenSections(section.children, comments, result);
    }
  }
  return result;
}

export function SectionNav({ sections, comments }: SectionNavProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { activePlanId, setSectionStatus } = usePlanStore();
  const [isApproving, setIsApproving] = useState(false);

  const flatSections = useMemo(
    () => flattenSections(sections, comments),
    [sections, comments]
  );

  // Track active section based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    // Observe all section elements
    flatSections.forEach((section) => {
      const el = document.getElementById(`section-${section.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [flatSections]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, resolved: 0 };
    flatSections.forEach(s => counts[s.status]++);
    return counts;
  }, [flatSections]);

  const handleApproveAll = async () => {
    if (!activePlanId || isApproving) return;

    setIsApproving(true);
    try {
      // Approve all pending sections
      for (const section of flatSections) {
        if (section.status === 'pending') {
          await setSectionStatus(activePlanId, section.id, 'approved', section.heading);
        }
      }
    } finally {
      setIsApproving(false);
    }
  };

  const pendingCount = statusCounts.pending;
  const allApproved = pendingCount === 0 && statusCounts.rejected === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <List size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Sections</span>
          <span className="text-xs text-muted-foreground">
            ({flatSections.length})
          </span>
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
          {statusCounts.approved > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {statusCounts.approved} approved
            </span>
          )}
          {statusCounts.pending > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {statusCounts.pending} pending
            </span>
          )}
          {statusCounts.rejected > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {statusCounts.rejected} needs work
            </span>
          )}
        </div>

        {/* Approve All Button */}
        <button
          onClick={handleApproveAll}
          disabled={allApproved || isApproving}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
            allApproved
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500',
            isApproving && 'opacity-50 cursor-wait'
          )}
        >
          {allApproved ? (
            <>
              <CheckCheck size={14} />
              All Approved
            </>
          ) : (
            <>
              <Check size={14} />
              {isApproving ? 'Approving...' : `Approve All (${pendingCount})`}
            </>
          )}
        </button>

      </div>

      {/* Section list */}
      <nav className="flex-1 overflow-auto py-1">
        {flatSections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors',
              activeSection === section.id && 'bg-primary/10 border-r-2 border-r-primary'
            )}
            style={{ paddingLeft: `${(section.level - 1) * 10 + 12}px` }}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                statusDotColors[section.status]
              )}
            />
            <span
              className={cn(
                'font-display text-xs truncate leading-tight',
                activeSection === section.id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {section.heading}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
