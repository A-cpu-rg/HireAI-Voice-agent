"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Link2,
  Loader,
  Phone,
  Save,
  TriangleAlert,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

export default function Settings() {
  const { setBolnaConfig, isConfigured, setIsConfigured, setMode } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://your-app.com/api/bolna/webhook");
  const [form, setForm] = useState({
    apiKey: "",
    agentId: "",
    webhookUrl: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/bolna/webhook`);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/config", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Config request failed with ${res.status}`);
        }

        const data = await res.json();
        if (cancelled) return;

        const configured = Boolean(data.hasKey && data.hasAgent);
        setIsConfigured(configured);
        setMaskedApiKey(data.maskedApiKey || "");
        setForm({
          apiKey: "",
          agentId: data.agentId || "",
          webhookUrl: "",
        });
        setBolnaConfig({ apiKey: "", agentId: data.agentId || "", webhookUrl: "" });
        setMode("live");
      } catch {
        if (cancelled) return;
        setIsConfigured(false);
        setMaskedApiKey("");
        setForm({
          apiKey: "",
          agentId: "",
          webhookUrl: "",
        });
        setBolnaConfig({ apiKey: "", agentId: "", webhookUrl: "" });
        setMode("live");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [setBolnaConfig, setIsConfigured, setMode]);

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to save settings");
      }

      const liveConfigured = Boolean((form.apiKey || maskedApiKey) && form.agentId);
      setBolnaConfig(form);
      setIsConfigured(liveConfigured);
      setMode("live");
      toast.success("Bolna settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" subtitle="Connect Bolna once, then run AI calls from the candidate workflow" />

      <div className="pt-16 p-6 space-y-6 max-w-5xl">
        {loading ? (
          <div className="text-center py-20 text-white/50">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            <div className={cn(
              "flex items-center gap-3 rounded-2xl p-4 border",
              isConfigured ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
            )}>
              {isConfigured ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Bot className="w-5 h-5 text-amber-400" />}
              <div>
                <p className={cn("text-sm font-semibold", isConfigured ? "text-emerald-300" : "text-amber-300")}>
                  {isConfigured ? "Bolna connected" : "Bolna setup required"}
                </p>
                <p className={cn("text-xs mt-0.5", isConfigured ? "text-emerald-400/70" : "text-amber-400/70")}>
                  {isConfigured
                    ? "Your HireAI workflow is connected to Bolna and ready for real test calls."
                    : "Add your Bolna API key and agent ID below, then start real AI calls from Candidates."}
                </p>
              </div>
            </div>

            <div className="bg-[#13131f] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Connect Bolna</h2>
                  <p className="text-sm text-white/45 mt-1">
                    Open Bolna, generate your API key, create an agent, then paste both values here.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href="https://platform.bolna.ai/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Get API Key
                  </a>
                  <a
                    href="https://platform.bolna.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium px-4 py-2.5 border border-white/10 transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    Create Agent
                  </a>
                  <a
                    href="https://platform.bolna.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium px-4 py-2.5 border border-white/10 transition-colors"
                  >
                    Open Bolna Platform
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "Generate API Key",
                    text: "Open Developers, click Generate new API Key, and copy it immediately. Bolna usually shows it only once.",
                  },
                  {
                    step: "2",
                    title: "Create Agent",
                    text: "Go to the agent setup section, click New Agent, paste your prompt, and add the webhook URL shown below.",
                  },
                  {
                    step: "3",
                    title: "Paste and Connect",
                    text: "Paste the API key and agent ID in HireAI, save connection, then start a real AI call from Candidates.",
                  },
                ].map((item) => (
                  <div key={item.step} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-[10px] font-bold tracking-[0.3em] text-indigo-300/70 mb-2">STEP {item.step}</div>
                    <p className="text-sm font-semibold text-white mb-1.5">{item.title}</p>
                    <p className="text-xs leading-relaxed text-white/45">{item.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Bolna API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      placeholder={maskedApiKey || "bolna_sk_..."}
                      className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-4 pr-12 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">
                    Get it from Developers and save it safely.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Agent ID</label>
                  <input
                    type="text"
                    value={form.agentId}
                    onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono"
                  />
                  <p className="text-xs text-white/30 mt-1.5">
                    Create an agent on Bolna, then copy its UUID here.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0b0b14] p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link2 className="w-4 h-4 text-indigo-400" />
                        <p className="text-sm font-semibold text-white">Webhook URL</p>
                      </div>
                      <p className="text-xs text-white/40 mb-3">
                        Add this URL while creating your Bolna agent so completed calls send results back to HireAI.
                      </p>
                      <p className="text-sm font-mono text-indigo-300 break-all">{webhookUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(webhookUrl, "Webhook URL")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 text-sm px-3 py-2 border border-white/10 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Trial limitation</p>
                      <p className="text-xs text-amber-200/75 leading-relaxed mt-1">
                        On the Bolna trial plan, real calls usually work only on verified phone numbers. For testing, verify your own number and call yourself first. For broader live usage, you may need to add funds to your Bolna account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Connect"}
                  </button>
                  {form.apiKey && form.agentId && (
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium px-5 py-2.5 rounded-xl border border-white/10 transition-all"
                    >
                      {testing ? <Loader className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      {testing ? "Testing..." : "Test Connection"}
                    </button>
                  )}
                  {testResult && (
                    <div className={cn("text-sm font-medium", testResult === "success" ? "text-emerald-400" : "text-rose-400")}>
                      {testResult === "success" ? "Connected successfully" : "Connection failed"}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-[#13131f] border border-white/5 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Simple setup flow</h3>
              <div className="space-y-3">
                {[
                  "Open Settings",
                  "Click Get API Key",
                  "Generate your API key in Bolna Developers",
                  "Click Create Agent",
                  "Paste your agent prompt and webhook URL in Bolna",
                  "Copy the Agent ID back into HireAI",
                  "Click Connect",
                  "Go to Candidates and click Start AI Call",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <p className="text-sm text-white/65">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
