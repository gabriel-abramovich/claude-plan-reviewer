import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { PlanListItem, ParsedPlan, ParsedSection, PlanMetadata, StatusCounts } from '../../src/types/plan';
import { SectionStatus } from '../../src/types/comment';
import { CommentService } from './comment-service';

const PLANS_DIR = path.join(os.homedir(), '.claude', 'plans');

function generateSectionId(heading: string, level: number, ancestors: string[] = []): string {
  const normalized = heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  const ancestorPath = ancestors.length > 0
    ? ancestors.map(a => a.substring(0, 20)).join('_') + '_'
    : '';

  return `${ancestorPath}${level}_${normalized}`;
}

interface HeadingMatch {
  level: number;
  text: string;
  line: number;
}

function parseMarkdownContent(content: string, planId: string, planPath: string): ParsedPlan {
  const lines = content.split('\n');
  const headings: HeadingMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i,
      });
    }
  }

  const sections = buildSectionTree(lines, headings);

  const title = sections.length > 0 && sections[0].level === 1
    ? sections[0].heading
    : planId.replace(/-/g, ' ');

  const metadata: PlanMetadata = {
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
    sectionCount: countSections(sections),
    fileSize: Buffer.byteLength(content, 'utf8'),
  };

  return {
    id: planId,
    path: planPath,
    title,
    rawContent: content,
    sections,
    metadata,
  };
}

function buildSectionTree(lines: string[], headings: HeadingMatch[]): ParsedSection[] {
  if (headings.length === 0) {
    return [{
      id: '1_content',
      heading: 'Content',
      level: 1,
      content: lines.join('\n'),
      startLine: 0,
      endLine: lines.length - 1,
      children: [],
    }];
  }

  const sections: ParsedSection[] = [];
  const stack: { section: ParsedSection; ancestors: string[] }[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];

    const endLine = nextHeading ? nextHeading.line - 1 : lines.length - 1;
    const contentLines = lines.slice(heading.line + 1, endLine + 1);
    const content = contentLines.join('\n').trim();

    const ancestors: string[] = [];
    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j].section.level < heading.level) {
        ancestors.unshift(...stack[j].ancestors, stack[j].section.heading
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 20));
        break;
      }
    }

    const section: ParsedSection = {
      id: generateSectionId(heading.text, heading.level, ancestors),
      heading: heading.text,
      level: heading.level,
      content,
      startLine: heading.line,
      endLine,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].section.level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      sections.push(section);
    } else {
      stack[stack.length - 1].section.children.push(section);
    }

    stack.push({ section, ancestors });
  }

  return sections;
}

function countSections(sections: ParsedSection[]): number {
  let count = sections.length;
  for (const section of sections) {
    count += countSections(section.children);
  }
  return count;
}

function collectSectionIds(sections: ParsedSection[]): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    ids.push(section.id);
    ids.push(...collectSectionIds(section.children));
  }
  return ids;
}

export class PlanService {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  async listPlans(): Promise<PlanListItem[]> {
    try {
      const files = await fs.readdir(PLANS_DIR);
      const plans: PlanListItem[] = [];

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(PLANS_DIR, file);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const id = path.basename(file, '.md');

        // Get title from first h1
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id.replace(/-/g, ' ');

        // Parse plan to get all section IDs
        const plan = parseMarkdownContent(content, id, filePath);
        const allSectionIds = collectSectionIds(plan.sections);
        const totalSections = allSectionIds.length;

        // Check for comments and compute status counts
        const comments = await this.commentService.getComments(id);
        const unresolvedCount = comments
          ? comments.sections.reduce(
              (count, section) =>
                count + section.comments.filter((c) => !c.resolved).length,
              0
            )
          : 0;

        // Compute status counts for each section
        const statusCounts: StatusCounts = {
          pending: 0,
          approved: 0,
          rejected: 0,
          resolved: 0,
          total: totalSections,
        };

        for (const sectionId of allSectionIds) {
          const sectionReview = comments?.sections.find(s => s.sectionId === sectionId);
          const status: SectionStatus = sectionReview?.status || 'pending';
          statusCounts[status]++;
        }

        plans.push({
          id,
          title,
          path: filePath,
          modifiedAt: stat.mtime.toISOString(),
          hasComments: comments !== null,
          unresolvedCount,
          statusCounts,
        });
      }

      // Sort by modification time, newest first
      plans.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

      return plans;
    } catch (err) {
      console.error('Error listing plans:', err);
      return [];
    }
  }

  async getPlan(id: string): Promise<ParsedPlan | null> {
    try {
      const filePath = path.join(PLANS_DIR, `${id}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      const stat = await fs.stat(filePath);

      const plan = parseMarkdownContent(content, id, filePath);
      plan.metadata.modifiedAt = stat.mtime.toISOString();
      plan.metadata.createdAt = stat.birthtime.toISOString();

      return plan;
    } catch (err) {
      console.error(`Error getting plan ${id}:`, err);
      return null;
    }
  }
}
