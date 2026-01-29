export type SectionStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface Comment {
  id: string;
  sectionId: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SectionReview {
  sectionId: string;
  heading: string;
  headingLevel: number;
  status: SectionStatus;
  resolvedAt?: string;
  comments: Comment[];
}

export interface PlanCommentFile {
  planId: string;
  planPath: string;
  createdAt: string;
  updatedAt: string;
  sections: SectionReview[];
}
