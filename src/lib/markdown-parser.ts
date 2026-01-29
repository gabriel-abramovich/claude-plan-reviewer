import { ParsedPlan, ParsedSection, PlanMetadata } from '@/types/plan';
import { generateSectionId } from './section-id';

interface HeadingMatch {
  level: number;
  text: string;
  line: number;
  index: number;
}

/**
 * Parse markdown content into structured sections
 */
export function parseMarkdown(
  content: string,
  planId: string,
  planPath: string
): ParsedPlan {
  const lines = content.split('\n');
  const headings = extractHeadings(lines);
  const sections = buildSectionTree(lines, headings);

  const title = sections.length > 0 && sections[0].level === 1
    ? sections[0].heading
    : planId.replace(/-/g, ' ');

  const metadata: PlanMetadata = {
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
    sectionCount: countSections(sections),
    fileSize: new Blob([content]).size,
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

function extractHeadings(lines: string[]): HeadingMatch[] {
  const headings: HeadingMatch[] = [];
  let charIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);

    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i,
        index: charIndex,
      });
    }

    charIndex += line.length + 1; // +1 for newline
  }

  return headings;
}

function buildSectionTree(lines: string[], headings: HeadingMatch[]): ParsedSection[] {
  if (headings.length === 0) {
    // No headings, return entire content as single section
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

    // Find ancestors for ID generation
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

    // Pop stack until we find parent level
    while (stack.length > 0 && stack[stack.length - 1].section.level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level section
      sections.push(section);
    } else {
      // Child section
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

/**
 * Flatten section tree into array
 */
export function flattenSections(sections: ParsedSection[]): ParsedSection[] {
  const result: ParsedSection[] = [];

  function traverse(sectionList: ParsedSection[]) {
    for (const section of sectionList) {
      result.push(section);
      traverse(section.children);
    }
  }

  traverse(sections);
  return result;
}

/**
 * Find a section by ID
 */
export function findSection(
  sections: ParsedSection[],
  sectionId: string
): ParsedSection | null {
  for (const section of sections) {
    if (section.id === sectionId) return section;
    const found = findSection(section.children, sectionId);
    if (found) return found;
  }
  return null;
}
