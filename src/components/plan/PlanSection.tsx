import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ParsedSection } from '@/types/plan';
import { SectionReview, SectionStatus } from '@/types/comment';
import { usePlanStore } from '@/stores/plan-store';
import { SectionHeader } from './SectionHeader';
import { SectionComments } from '@/components/comments/SectionComments';
import { cn } from '@/lib/utils';

interface PlanSectionProps {
  section: ParsedSection;
  planId: string;
  sectionReview?: SectionReview;
  depth: number;
}

const statusBorderColors: Record<SectionStatus, string> = {
  pending: 'border-l-amber-400 dark:border-l-amber-500',
  approved: 'border-l-emerald-500 dark:border-l-emerald-400',
  rejected: 'border-l-rose-500 dark:border-l-rose-400',
  resolved: 'border-l-slate-300 dark:border-l-slate-600',
};

const statusBackgrounds: Record<SectionStatus, string> = {
  pending: '',
  approved: 'bg-emerald-50/30 dark:bg-emerald-950/10',
  rejected: 'bg-rose-50/30 dark:bg-rose-950/10',
  resolved: 'bg-slate-50/30 dark:bg-slate-950/10',
};

export function PlanSection({ section, planId, sectionReview, depth }: PlanSectionProps) {
  const { collapsedSections, toggleSectionCollapse, setSectionStatus, comments } = usePlanStore();
  const [showComments, setShowComments] = useState(false);

  const isCollapsed = collapsedSections.includes(section.id);
  const status = sectionReview?.status || 'pending';
  const commentCount = sectionReview?.comments.filter((c) => !c.resolved).length || 0;

  const handleStatusChange = async (newStatus: SectionStatus) => {
    await setSectionStatus(planId, section.id, newStatus, section.heading);
  };

  return (
    <section
      id={`section-${section.id}`}
      className={cn(
        'relative rounded-lg transition-all scroll-mt-20',
        depth > 0 && 'ml-4 border-l-[3px] pl-4',
        depth > 0 && statusBorderColors[status],
        statusBackgrounds[status],
        status === 'resolved' && 'opacity-70'
      )}
    >
      <SectionHeader
        heading={section.heading}
        level={section.level}
        status={status}
        commentCount={commentCount}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => toggleSectionCollapse(section.id)}
        onToggleComments={() => setShowComments(!showComments)}
        onStatusChange={handleStatusChange}
      />

      {/* Comments panel - shown at top when expanded */}
      {showComments && (
        <div className="mt-2 ml-7 mb-4">
          <SectionComments
            planId={planId}
            sectionId={section.id}
            heading={section.heading}
            sectionReview={sectionReview}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Section content */}
          {section.content && (
            <div className="markdown-content mt-2 pl-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
            </div>
          )}

          {/* Child sections */}
          <div className="mt-3">
            {section.children.map((child) => {
              const childReview = comments[planId]?.sections.find(
                (s) => s.sectionId === child.id
              );
              return (
                <PlanSection
                  key={child.id}
                  section={child}
                  planId={planId}
                  sectionReview={childReview}
                  depth={depth + 1}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
