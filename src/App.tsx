import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlanStore, useTheme } from '@/stores/plan-store';
import { MainLayout } from '@/components/layout/MainLayout';

function App() {
  const [searchParams] = useSearchParams();
  const { loadPlans, setActivePlan } = usePlanStore();
  const theme = useTheme();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Handle plan query param
  useEffect(() => {
    const planId = searchParams.get('plan');
    if (planId) {
      setActivePlan(planId);
    }
  }, [searchParams, setActivePlan]);

  // WebSocket for live updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const { activePlanId, loadComments } = usePlanStore.getState();

      switch (message.type) {
        case 'plan:changed':
        case 'plan:added':
        case 'plan:removed':
          loadPlans();
          if (message.data?.id === activePlanId) {
            setActivePlan(activePlanId);
          }
          break;
        case 'comments:changed':
          // Reload both comments AND plans (for updated statusCounts in sidebar)
          loadPlans();
          if (activePlanId) {
            loadComments(activePlanId);
          }
          break;
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => ws.close();
  }, [loadPlans, setActivePlan]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { toggleSidebar, setTheme, theme } = usePlanStore.getState();

      // Cmd/Ctrl + /  = toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleSidebar();
      }

      // t = toggle theme
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !isInputFocused()) {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    function isInputFocused() {
      const active = document.activeElement;
      return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <MainLayout />;
}

export default App;
