import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { fetchExportedMoonshots } from "../utils/nostr/fetchMoonshots";
import type { ExportedMoonshot, ExportedStatus } from "../types/types";

interface ExportedMoonshotsContextType {
  exportedMoonshots: Map<string, ExportedMoonshot>;
  loading: boolean;
  isExported: (moonshotEventId: string) => boolean;
  getExportStatus: (moonshotEventId: string) => ExportedStatus;
  getExportedMoonshot: (moonshotEventId: string) => ExportedMoonshot | undefined;
}

const ExportedMoonshotsContext = createContext<ExportedMoonshotsContextType | undefined>(undefined);

interface ExportedMoonshotsProviderProps {
  children: ReactNode;
}

export function ExportedMoonshotsProvider({ children }: ExportedMoonshotsProviderProps) {
  const { userPubkey } = useAuth();
  const [exportedMoonshots, setExportedMoonshots] = useState<Map<string, ExportedMoonshot>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userPubkey) {
        setExportedMoonshots(new Map());
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetchExportedMoonshots(userPubkey);
        console.log("EXPORTED MOONSHOTS MAP:", res);
        setExportedMoonshots(res);
      } catch (error) {
        console.error("Failed to fetch exported moonshots:", error);
        setExportedMoonshots(new Map());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userPubkey]);

  // Check if a moonshot is exported
  const isExported = (moonshotEventId: string): boolean => {
    return exportedMoonshots.has(moonshotEventId);
  };

  // Get full export status with event ID
  const getExportStatus = (moonshotEventId: string): ExportedStatus => {
    const exported = exportedMoonshots.get(moonshotEventId);
    return {
      isExported: !!exported,
      exportEventId: exported?.exportEventId ?? null,
    };
  };

  // Get the full exported moonshot object
  const getExportedMoonshot = (moonshotEventId: string): ExportedMoonshot | undefined => {
    return exportedMoonshots.get(moonshotEventId);
  };

  const value: ExportedMoonshotsContextType = {
    exportedMoonshots,
    loading,
    isExported,
    getExportStatus,
    getExportedMoonshot,
  };

  return (
    <ExportedMoonshotsContext.Provider value={value}>{children}</ExportedMoonshotsContext.Provider>
  );
}

export function useExportedMoonshots() {
  const context = useContext(ExportedMoonshotsContext);
  if (context === undefined) {
    throw new Error("useExportedMoonshots must be used within ExportedMoonshotsProvider");
  }
  return context;
}
