export interface ParsedPlan {
  id: string;
  path: string;
  title: string;
  rawContent: string;
  sections: ParsedSection[];
  metadata: PlanMetadata;
}

export interface ParsedSection {
  id: string;
  heading: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
  children: ParsedSection[];
}

export interface PlanMetadata {
  createdAt: string;
  modifiedAt: string;
  wordCount: number;
  sectionCount: number;
  fileSize: number;
}

export interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  resolved: number;
  total: number;
}

export interface PlanListItem {
  id: string;
  title: string;
  path: string;
  modifiedAt: string;
  hasComments: boolean;
  unresolvedCount: number;
  statusCounts: StatusCounts;
}
