"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Candidate, Job, CallLog, BolnaConfig, CandidateStatus } from "../types";
import toast from "react-hot-toast";

interface AppContextType {
  candidates: Candidate[];
  jobs: Job[];
  callLogs: CallLog[];
  bolnaConfig: BolnaConfig;
  setBolnaConfig: (config: BolnaConfig) => void;
  isConfigured: boolean;
  initiateCall: (candidateId: string) => Promise<void>;
  updateCandidateStatus: (id: string, status: CandidateStatus) => void;
  addCandidate: (candidate: any) => void;
  activeCallId: string | null;
  selectedCandidate: Candidate | null;
  setSelectedCandidate: (c: Candidate | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [bolnaConfig, setBolnaConfigState] = useState<BolnaConfig>({
    apiKey: "",
    agentId: "",
    webhookUrl: "", // Now handled automatically through API
  });

  // Fetch initial Data
  const refreshData = useCallback(async () => {
    try {
      const [candRes, jobsRes, callsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/jobs'),
        fetch('/api/calls')
      ]);
      if(candRes.ok) setCandidates(await candRes.json());
      if(jobsRes.ok) setJobs(await jobsRes.json());
      if(callsRes.ok) setCallLogs(await callsRes.json());
    } catch (e) {
      console.error("Failed to load initial APIs", e);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("bolna_config");
    if (saved) setBolnaConfigState(JSON.parse(saved));
    
    refreshData();
  }, [refreshData]);

  // Polling data specifically when there's an active call in progress
  useEffect(() => {
    let interval: any;
    const hasActiveCall = callLogs.some(c => c.status === 'in-progress') || candidates.some(c => c.status === 'calling');
    if (hasActiveCall) {
      interval = setInterval(() => {
        refreshData(); // Polling to get webhook updates!
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [callLogs, candidates, refreshData]);

  const setBolnaConfig = useCallback((config: BolnaConfig) => {
    setBolnaConfigState(config);
    localStorage.setItem("bolna_config", JSON.stringify(config));
    toast.success("Bolna configuration saved!", { icon: "🔑" });
  }, []);

  const isConfigured = Boolean(bolnaConfig.apiKey && bolnaConfig.agentId);

  const initiateCall = useCallback(async (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    if (!isConfigured) {
      toast.error("Please configure your Bolna API key and Agent ID in Settings!", {
        duration: 4000,
        icon: "⚠️",
      });
      return;
    }

    // Optimistic UI Update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: "calling" } as any : c))
    );
    setActiveCallId(candidateId);
    const toastId = toast.loading(`📞 Dispatching call securely via Backend API to Bolna...`);

    try {
      // PROXY API CALL TO SECURE BACKEND
      const response = await fetch("/api/bolna/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: bolnaConfig.apiKey,
          agentId: bolnaConfig.agentId,
          candidateId: candidate.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      toast.success(`✅ Backend initiated call successfully! Bolna Call ID: ${data.call_id}`, { id: toastId });
      
      // Sync immediately
      await refreshData();
      
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to start Bolna call: ${err.message}`, { id: toastId });
      // Revert Optimistic Update
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: "pending" } as any : c))
      );
      setActiveCallId(null);
    }
  }, [candidates, bolnaConfig, isConfigured, refreshData]);

  const updateCandidateStatus = useCallback(async (id: string, status: CandidateStatus) => {
    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } as any : c))
    );
    // Real API Request
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast.success(`Candidate status updated to ${status}`);
    } catch(e) {
      toast.error("Failed to update status on server.");
    }
  }, []);

  const addCandidate = useCallback(async (candidateData: any) => {
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidateData)
      });
      if(res.ok) {
        const newCand = await res.json();
        setCandidates((prev) => [newCand, ...prev]);
        toast.success(`✅ ${candidateData.name} added successfully to Database!`);
      }
    } catch(e) {
      toast.error("Failed to insert candidate to Database.");
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        candidates,
        jobs,
        callLogs,
        bolnaConfig,
        setBolnaConfig,
        isConfigured,
        initiateCall,
        updateCandidateStatus,
        addCandidate,
        activeCallId,
        selectedCandidate,
        setSelectedCandidate,
        sidebarOpen,
        setSidebarOpen,
        refreshData
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
