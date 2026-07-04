"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
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
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header
        title="Settings"
        subtitle="Connect Bolna once, then run AI calls from the candidate workflow"
      />

      <div className="max-w-5xl space-y-6 p-6 pt-16">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" />
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            {/* STATUS */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4",
                isConfigured ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
              )}
            >
              {isConfigured ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <Bot className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isConfigured ? "Bolna connected" : "Bolna setup required"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {isConfigured
                    ? "Your workflow is ready for AI calls"
                    : "Add API key and agent ID to start"}
                </p>
              </div>
            </div>

            {/* MAIN CARD */}
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6">
              {/* HEADER */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Connect Bolna</h2>
                  <p className="text-sm text-gray-500">
                    Generate API key → create agent → paste here
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://platform.bolna.ai/developers"
                    target="_blank"
                    className="flex gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white"
                  >
                    <Key className="h-4 w-4" /> API Key
                  </a>

                  <a
                    href="https://platform.bolna.ai"
                    target="_blank"
                    className="flex gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm"
                  >
                    <Bot className="h-4 w-4" /> Agent
                  </a>
                </div>
              </div>

              {/* STEPS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  "Generate API Key from Bolna",
                  "Create Agent + add webhook",
                  "Paste values and connect",
                ].map((text, i) => (
                  <div key={i} className="rounded-xl border bg-gray-50 p-4">
                    <p className="mb-1 text-xs text-gray-400">STEP {i + 1}</p>
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
              </div>

              {/* FORM */}
              <form onSubmit={handleSave} className="space-y-5">
                {/* API KEY */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">API Key</label>

                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      placeholder={maskedApiKey || "bolna_sk_..."}
                      className="w-full rounded-lg border px-4 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                    >
                      {showKey ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* AGENT ID */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Agent ID</label>
                  <input
                    value={form.agentId}
                    onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                    className="w-full rounded-lg border px-4 py-2 text-sm"
                  />
                </div>

                {/* WEBHOOK */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="mb-1 text-sm font-semibold">Webhook URL</p>
                  <p className="mb-2 text-xs text-gray-500">Add this in Bolna agent</p>

                  <p className="font-mono text-sm break-all text-teal-600">{webhookUrl}</p>

                  <button
                    type="button"
                    onClick={() => copyText(webhookUrl, "Webhook URL")}
                    className="mt-3 rounded bg-gray-200 px-3 py-1 text-sm"
                  >
                    Copy
                  </button>
                </div>

                {/* WARNING */}
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <TriangleAlert className="text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Trial plan only works with verified numbers.
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex gap-2 rounded-lg bg-teal-600 px-5 py-2 text-white"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Connect"}
                  </button>

                  {form.apiKey && form.agentId && (
                    <button
                      type="button"
                      onClick={handleTest}
                      className="flex gap-2 rounded-lg bg-gray-100 px-5 py-2"
                    >
                      <Phone className="h-4 w-4" />
                      Test
                    </button>
                  )}

                  {testResult && (
                    <span className={testResult === "success" ? "text-green-600" : "text-red-500"}>
                      {testResult === "success" ? "Connected" : "Failed"}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* FLOW */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold">Setup Flow</h3>

              <div className="space-y-2">
                {["Get API Key", "Create Agent", "Paste in HireAI", "Connect", "Start AI Call"].map(
                  (step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-600">
                        {i + 1}
                      </div>
                      <p className="text-sm">{step}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
