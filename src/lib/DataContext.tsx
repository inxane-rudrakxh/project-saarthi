import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ensureSeeded, loadAlerts, loadModelMetrics } from './dataService';
import { generateAlerts } from './riskEngine';
import type { Project, Alert, ModelMetric } from './types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citations: any[];
}

interface DataContextValue {
  projects: Project[];
  alerts: Alert[];
  metrics: ModelMetric[];
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reseed: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projs, alts, mets] = await Promise.all([
        ensureSeeded(),
        loadAlerts(),
        loadModelMetrics(),
      ]);
      setProjects(projs);
      // If alerts table is empty but projects loaded, compute in-memory
      if (alts.length === 0 && projs.length > 0) {
        setAlerts(generateAlerts(projs));
      } else {
        setAlerts(alts);
      }
      setMetrics(mets);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{
      projects, alerts, metrics, chatMessages, setChatMessages, loading, error,
      refresh: loadData,
      reseed: async () => {
        setLoading(true);
        const { seedData } = await import('./dataService');
        await seedData();
        await loadData();
      },
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
