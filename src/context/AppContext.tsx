"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppMode, BolnaConfig } from "../types";

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  bolnaConfig: BolnaConfig;
  setBolnaConfig: (config: BolnaConfig) => void;
  isConfigured: boolean;
  setIsConfigured: (isConfigured: boolean) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  currentUser: { id: string; name: string | null; email: string } | null;
  setCurrentUser: (user: { id: string; name: string | null; email: string } | null) => void;
  activeCallId: string | null;
  setActiveCallId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [mode, setModeState] = useState<AppMode>("live");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [bolnaConfig, setBolnaConfigState] = useState<BolnaConfig>({
    apiKey: "",
    agentId: "",
    webhookUrl: "", 
  });

  const setBolnaConfig = useCallback((config: BolnaConfig) => {
    setBolnaConfigState(config);
    setIsConfigured(Boolean(config.apiKey && config.agentId));
  }, []);

  useEffect(() => {
    const savedMode = window.localStorage.getItem("hireai-mode") as AppMode | null;
    if (savedMode === "live") {
      setModeState(savedMode);
    }
  }, []);

  const setMode = useCallback((nextMode: AppMode) => {
    setModeState(nextMode);
    window.localStorage.setItem("hireai-mode", nextMode);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        bolnaConfig,
        setBolnaConfig,
        isConfigured,
        setIsConfigured,
        mode,
        setMode,
        currentUser,
        setCurrentUser,
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
