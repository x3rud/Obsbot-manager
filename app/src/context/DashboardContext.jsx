import { createContext, useContext } from 'react';
import { useDashboard } from '@/hooks/useDashboard';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const dashboard = useDashboard();
  return (
    <DashboardContext.Provider value={dashboard}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => useContext(DashboardContext);
