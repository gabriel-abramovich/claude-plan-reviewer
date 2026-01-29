/**
 * Generate a stable section ID from heading text and hierarchy
 */
export function generateSectionId(
  heading: string,
  level: number,
  ancestors: string[] = []
): string {
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

/**
 * Parse a section ID back to its components
 */
export function parseSectionId(sectionId: string): {
  level: number;
  slug: string;
  ancestors: string[];
} {
  const parts = sectionId.split('_');
  const levelPart = parts.find(p => /^\d$/.test(p));
  const level = levelPart ? parseInt(levelPart, 10) : 1;
  const levelIndex = parts.indexOf(levelPart || '1');

  return {
    level,
    slug: parts.slice(levelIndex + 1).join('_'),
    ancestors: parts.slice(0, levelIndex),
  };
}
