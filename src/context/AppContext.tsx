"use client";

import React, { createContext, useContext, useState } from "react";
import { Candidate, Job, CallLog, BolnaConfig, CandidateStatus } from "../types";
import toast from "react-hot-toast";

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  bolnaConfig: BolnaConfig;
  setBolnaConfig: (config: BolnaConfig) => void;
  isConfigured: boolean;
  setIsConfigured: (isConfigured: boolean) => void;
  activeCallId: string | null;
  setActiveCallId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [bolnaConfig, setBolnaConfigState] = useState<BolnaConfig>({
    apiKey: "",
    agentId: "",
    webhookUrl: "", 
  });

  const setBolnaConfig = (config: BolnaConfig) => {
    setBolnaConfigState(config);
    setIsConfigured(Boolean(config.apiKey && config.agentId));
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        bolnaConfig,
        setBolnaConfig,
        isConfigured,
        setIsConfigured,
        activeCallId,
        setActiveCallId
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
