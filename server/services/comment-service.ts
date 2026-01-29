import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Comment, PlanCommentFile, SectionReview, SectionStatus } from '../../src/types/comment';

const COMMENTS_DIR = path.join(os.homedir(), '.claude', 'plan-comments');
const PLANS_DIR = path.join(os.homedir(), '.claude', 'plans');

export class CommentService {
  constructor() {
    this.ensureDir();
  }

  private async ensureDir() {
    try {
      await fs.mkdir(COMMENTS_DIR, { recursive: true });
    } catch (err) {
      // Ignore if exists
    }
  }

  private getFilePath(planId: string): string {
    return path.join(COMMENTS_DIR, `${planId}.json`);
  }

  async getComments(planId: string): Promise<PlanCommentFile | null> {
    try {
      const filePath = this.getFilePath(planId);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async saveComments(planId: string, data: PlanCommentFile): Promise<void> {
    const filePath = this.getFilePath(planId);
    data.updatedAt = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async initializeComments(planId: string): Promise<PlanCommentFile> {
    const existing = await this.getComments(planId);
    if (existing) return existing;

    const planPath = path.join(PLANS_DIR, `${planId}.md`);
    const now = new Date().toISOString();

    const data: PlanCommentFile = {
      planId,
      planPath,
      createdAt: now,
      updatedAt: now,
      sections: [],
    };

    await this.saveComments(planId, data);
    return data;
  }

  async addComment(planId: string, sectionId: string, text: string, heading: string): Promise<Comment> {
    let data = await this.getComments(planId);
    if (!data) {
      data = await this.initializeComments(planId);
    }

    const comment: Comment = {
      id: uuidv4(),
      sectionId,
      text,
      author: 'User',
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    // Find or create section review
    let sectionReview = data.sections.find((s) => s.sectionId === sectionId);
    if (!sectionReview) {
      sectionReview = {
        sectionId,
        heading,
        headingLevel: 1,
        status: 'pending',
        comments: [],
      };
      data.sections.push(sectionReview);
    } else if (!sectionReview.heading && heading) {
      // Update heading if it was empty
      sectionReview.heading = heading;
    }

    sectionReview.comments.push(comment);
    await this.saveComments(planId, data);

    return comment;
  }

  async updateComment(
    planId: string,
    commentId: string,
    updates: Partial<Comment>
  ): Promise<Comment | null> {
    const data = await this.getComments(planId);
    if (!data) return null;

    for (const section of data.sections) {
      const comment = section.comments.find((c) => c.id === commentId);
      if (comment) {
        Object.assign(comment, updates);
        comment.updatedAt = new Date().toISOString();
        await this.saveComments(planId, data);
        return comment;
      }
    }

    return null;
  }

  async deleteComment(planId: string, commentId: string): Promise<boolean> {
    const data = await this.getComments(planId);
    if (!data) return false;

    for (const section of data.sections) {
      const index = section.comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        section.comments.splice(index, 1);
        await this.saveComments(planId, data);
        return true;
      }
    }

    return false;
  }

  async setSectionStatus(
    planId: string,
    sectionId: string,
    status: SectionStatus,
    heading?: string
  ): Promise<SectionReview | null> {
    let data = await this.getComments(planId);
    if (!data) {
      data = await this.initializeComments(planId);
    }

    let sectionReview = data.sections.find((s) => s.sectionId === sectionId);
    if (!sectionReview) {
      sectionReview = {
        sectionId,
        heading: heading || '',
        headingLevel: 1,
        status,
        comments: [],
      };
      data.sections.push(sectionReview);
    } else if (!sectionReview.heading && heading) {
      // Update heading if it was empty
      sectionReview.heading = heading;
    }

    sectionReview.status = status;
    if (status === 'resolved') {
      sectionReview.resolvedAt = new Date().toISOString();
    } else {
      delete sectionReview.resolvedAt;
    }

    await this.saveComments(planId, data);
    return sectionReview;
  }
}
