import { ParsedPlan, PlanListItem } from '@/types/plan';
import { Comment, PlanCommentFile, SectionStatus } from '@/types/comment';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Plans API
export async function getPlans(): Promise<PlanListItem[]> {
  return fetchJson('/plans');
}

export async function getPlan(id: string): Promise<ParsedPlan> {
  return fetchJson(`/plans/${id}`);
}

export async function refreshPlans(): Promise<void> {
  await fetchJson('/plans/refresh', { method: 'POST' });
}

// Comments API
export async function getComments(planId: string): Promise<PlanCommentFile | null> {
  try {
    return await fetchJson(`/comments/${planId}`);
  } catch {
    return null;
  }
}

export async function addComment(
  planId: string,
  sectionId: string,
  text: string,
  heading: string
): Promise<Comment> {
  return fetchJson(`/comments/${planId}`, {
    method: 'POST',
    body: JSON.stringify({ sectionId, text, heading }),
  });
}

export async function updateComment(
  planId: string,
  commentId: string,
  updates: Partial<Comment>
): Promise<Comment> {
  return fetchJson(`/comments/${planId}/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteComment(
  planId: string,
  commentId: string
): Promise<void> {
  await fetchJson(`/comments/${planId}/${commentId}`, {
    method: 'DELETE',
  });
}

export async function setSectionStatus(
  planId: string,
  sectionId: string,
  status: SectionStatus,
  heading?: string
): Promise<void> {
  await fetchJson(`/sections/${planId}/${sectionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, heading }),
  });
}

export async function resolveComment(
  planId: string,
  commentId: string
): Promise<Comment> {
  return updateComment(planId, commentId, {
    resolved: true,
    resolvedAt: new Date().toISOString(),
  });
}
