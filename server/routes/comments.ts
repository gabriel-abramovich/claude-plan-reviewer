import { Router } from 'express';
import { CommentService } from '../services/comment-service';
import { SectionStatus } from '../../src/types/comment';

const commentsRouter = Router();
const sectionsRouter = Router();
const commentService = new CommentService();

// Get comments for a plan
commentsRouter.get('/:planId', async (req, res) => {
  try {
    const comments = await commentService.getComments(req.params.planId);
    if (!comments) {
      // Return empty structure if no comments yet
      return res.json({
        planId: req.params.planId,
        planPath: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [],
      });
    }
    res.json(comments);
  } catch (err) {
    console.error('Error getting comments:', err);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment to a section
commentsRouter.post('/:planId', async (req, res) => {
  try {
    const { sectionId, text, heading } = req.body;
    if (!sectionId || !text) {
      return res.status(400).json({ error: 'sectionId and text are required' });
    }

    const comment = await commentService.addComment(req.params.planId, sectionId, text, heading || '');
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update a comment
commentsRouter.patch('/:planId/:commentId', async (req, res) => {
  try {
    const comment = await commentService.updateComment(
      req.params.planId,
      req.params.commentId,
      req.body
    );
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
commentsRouter.delete('/:planId/:commentId', async (req, res) => {
  try {
    const deleted = await commentService.deleteComment(
      req.params.planId,
      req.params.commentId
    );
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Update section status
sectionsRouter.patch('/:planId/:sectionId/status', async (req, res) => {
  try {
    const { status, heading } = req.body;
    if (!['pending', 'approved', 'rejected', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const section = await commentService.setSectionStatus(
      req.params.planId,
      req.params.sectionId,
      status as SectionStatus,
      heading
    );
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(section);
  } catch (err) {
    console.error('Error updating section status:', err);
    res.status(500).json({ error: 'Failed to update section status' });
  }
});

export { commentsRouter, sectionsRouter };
