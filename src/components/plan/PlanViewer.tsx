import { ParsedPlan } from '@/types/plan';
import { useComments } from '@/stores/plan-store';
import { PlanSection } from './PlanSection';

interface PlanViewerProps {
  plan: ParsedPlan;
}

export function PlanViewer({ plan }: PlanViewerProps) {
  const commentsData = useComments(plan.id);

  const getSectionReview = (sectionId: string) => {
    return commentsData?.sections.find((s) => s.sectionId === sectionId);
  };

  return (
    <div className="plan-content relative">
      <article className="space-y-4">
        {plan.sections.map((section) => (
          <PlanSection
            key={section.id}
            section={section}
            planId={plan.id}
            sectionReview={getSectionReview(section.id)}
            depth={0}
          />
        ))}
      </article>
    </div>
  );
}
