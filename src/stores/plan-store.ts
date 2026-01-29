import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParsedPlan, PlanListItem } from '@/types/plan';
import { PlanCommentFile, SectionStatus } from '@/types/comment';
import * as api from '@/lib/api';

interface PlanState {
  // Plans
  plans: PlanListItem[];
  activePlanId: string | null;
  activePlan: ParsedPlan | null;
  isLoading: boolean;
  error: string | null;

  // Comments
  comments: Record<string, PlanCommentFile>;

  // UI State
  collapsedSections: string[];
  sidebarOpen: boolean;
  searchQuery: string;
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected';
  theme: 'light' | 'dark' | 'system';

  // Actions
  setActivePlan: (planId: string | null) => Promise<void>;
  loadPlans: () => Promise<void>;
  loadComments: (planId: string) => Promise<void>;

  addComment: (planId: string, sectionId: string, text: string, heading: string) => Promise<void>;
  resolveComment: (planId: string, commentId: string) => Promise<void>;
  deleteComment: (planId: string, commentId: string) => Promise<void>;

  setSectionStatus: (planId: string, sectionId: string, status: SectionStatus, heading?: string) => Promise<void>;
  toggleSectionCollapse: (sectionId: string) => void;

  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'pending' | 'approved' | 'rejected') => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      // Initial state
      plans: [],
      activePlanId: null,
      activePlan: null,
      isLoading: false,
      error: null,
      comments: {},
      collapsedSections: [],
      sidebarOpen: true,
      searchQuery: '',
      filterStatus: 'all',
      theme: 'system',

      // Plan actions
      loadPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const plans = await api.getPlans();
          set({ plans, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      setActivePlan: async (planId: string | null) => {
        if (!planId) {
          set({ activePlanId: null, activePlan: null });
          return;
        }

        set({ isLoading: true, activePlanId: planId });
        try {
          const plan = await api.getPlan(planId);
          set({ activePlan: plan, isLoading: false });
          await get().loadComments(planId);
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      // Comment actions
      loadComments: async (planId: string) => {
        try {
          const comments = await api.getComments(planId);
          if (comments) {
            set((state) => ({
              comments: { ...state.comments, [planId]: comments },
            }));
          }
        } catch (err) {
          console.error('Failed to load comments:', err);
        }
      },

      addComment: async (planId: string, sectionId: string, text: string, heading: string) => {
        try {
          await api.addComment(planId, sectionId, text, heading);
          await get().loadComments(planId);
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      resolveComment: async (planId: string, commentId: string) => {
        try {
          await api.resolveComment(planId, commentId);
          await get().loadComments(planId);
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      deleteComment: async (planId: string, commentId: string) => {
        try {
          await api.deleteComment(planId, commentId);
          await get().loadComments(planId);
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      setSectionStatus: async (planId: string, sectionId: string, status: SectionStatus, heading?: string) => {
        try {
          await api.setSectionStatus(planId, sectionId, status, heading);
          // Reload both comments AND plans (for updated statusCounts in sidebar)
          await Promise.all([
            get().loadComments(planId),
            get().loadPlans(),
          ]);
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      // UI actions
      toggleSectionCollapse: (sectionId: string) => {
        set((state) => {
          const collapsed = state.collapsedSections.includes(sectionId);
          return {
            collapsedSections: collapsed
              ? state.collapsedSections.filter((id) => id !== sectionId)
              : [...state.collapsedSections, sectionId],
          };
        });
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'plan-viewer-storage',
      partialize: (state) => ({
        activePlanId: state.activePlanId,
        collapsedSections: state.collapsedSections,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks
export const useActivePlan = () => usePlanStore((state) => state.activePlan);
export const usePlans = () => usePlanStore((state) => state.plans);
export const useComments = (planId: string | null) =>
  usePlanStore((state) => (planId ? state.comments[planId] : null));
export const useTheme = () => usePlanStore((state) => state.theme);
